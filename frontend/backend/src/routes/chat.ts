
import { OpenAPIHono } from "@hono/zod-openapi";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { db } from "../db";
import { conversations, messages } from "../db/schema";
import { eq, desc, and } from "drizzle-orm";
import {
    sendMessageRoute,
    listConversationsRoute,
    getConversationRoute,
    deleteConversationRoute,
} from "../api/chat";
import { authMiddleware } from "../middleware/auth";
import { processMessage, routeQuery, streamSubAgent, getAgentConfig, extractRichData } from "../agents";

const app = new OpenAPIHono();

// Apply auth middleware to all chat routes
app.use("/*", authMiddleware);

// ── POST /messages/stream — SSE Streaming Endpoint ───────
app.post("/messages/stream", async (c) => {
    const userId = c.get("userId");
    const body = await c.req.json();
    const { content, conversationId: reqConvId } = body;

    if (!content) {
        return c.json({ message: "Content is required" }, 400);
    }

    let convId = reqConvId;

    // Create new conversation if none provided
    if (!convId) {
        const title = content.length > 50 ? content.substring(0, 50) + "..." : content;
        const newConv = await db
            .insert(conversations)
            .values({ userId, title })
            .returning();
        convId = newConv[0].id;
    }

    // Save user message
    await db.insert(messages).values({
        conversationId: convId,
        role: "user",
        content,
    });

    // Update conversation timestamp
    await db
        .update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, convId));

    // Build conversation history for context
    const prevMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, convId))
        .orderBy(messages.createdAt);

    const conversationHistory = prevMessages.map((m) => ({
        role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
        content: m.content,
    }));

    // Route query first
    const targetAgent = await routeQuery(content);
    const config = getAgentConfig(targetAgent);

    // Save router message
    const routerContent = `I'll connect you with our ${targetAgent.charAt(0).toUpperCase() + targetAgent.slice(1)} Agent to assist you.`;
    const routerMsg = await db
        .insert(messages)
        .values({
            conversationId: convId,
            role: "router",
            content: routerContent,
            agentName: "Router",
        })
        .returning();

    // Stream the sub-agent response via SSE
    return streamSSE(c, async (stream) => {
        // Event 1: Conversation ID (so frontend knows)
        await stream.writeSSE({
            event: "conversation",
            data: JSON.stringify({ conversationId: convId }),
        });

        // Event 2: Router message
        await stream.writeSSE({
            event: "router",
            data: JSON.stringify({
                id: routerMsg[0].id,
                role: "router",
                content: routerContent,
                agentName: "Router",
                createdAt: routerMsg[0].createdAt.toISOString(),
            }),
        });

        // Event 3: Agent info (so frontend knows which agent is responding)
        await stream.writeSSE({
            event: "agent_start",
            data: JSON.stringify({
                role: targetAgent,
                agentName: config.name,
            }),
        });

        // Event 4+: Stream text tokens
        let fullText = "";
        try {
            const { textStream, result } = streamSubAgent(
                targetAgent,
                content,
                conversationHistory
            );

            for await (const textPart of textStream) {
                fullText += textPart;
                await stream.writeSSE({
                    event: "text_delta",
                    data: JSON.stringify({ delta: textPart }),
                });
            }

            // Wait for the full result to get tool data
            const finalResult = await result;

            // Extract rich data from tool calls (steps is a promise on stream result)
            const steps = await finalResult.steps;
            const richData = extractRichData(steps);

            // If the text was empty (tool-only response), use a fallback
            const finalText = await finalResult.text;
            if (!fullText && finalText) {
                fullText = finalText;
                await stream.writeSSE({
                    event: "text_delta",
                    data: JSON.stringify({ delta: fullText }),
                });
            }

            if (!fullText) {
                fullText = "I've processed your request. Is there anything else I can help with?";
                await stream.writeSSE({
                    event: "text_delta",
                    data: JSON.stringify({ delta: fullText }),
                });
            }

            // Save agent message to DB
            const agentMsg = await db
                .insert(messages)
                .values({
                    conversationId: convId,
                    role: targetAgent,
                    content: fullText,
                    agentName: config.name,
                    data: richData || null,
                })
                .returning();

            // Event: Rich data card (if any tool returned structured data)
            if (richData) {
                await stream.writeSSE({
                    event: "rich_data",
                    data: JSON.stringify(richData),
                });
            }

            // Event: Done
            await stream.writeSSE({
                event: "done",
                data: JSON.stringify({
                    messageId: agentMsg[0].id,
                    createdAt: agentMsg[0].createdAt.toISOString(),
                }),
            });
        } catch (error: any) {
            console.error("Streaming error:", error);
            await stream.writeSSE({
                event: "error",
                data: JSON.stringify({ message: error.message || "An error occurred" }),
            });
        }
    });
});

// ── POST /messages (Non-Streaming fallback) ──────────────
app.openapi(sendMessageRoute, async (c) => {
    const userId = c.get("userId");
    const { conversationId, content } = c.req.valid("json");

    let convId = conversationId;

    if (!convId) {
        const title = content.length > 50 ? content.substring(0, 50) + "..." : content;
        const newConv = await db
            .insert(conversations)
            .values({ userId, title })
            .returning();
        convId = newConv[0].id;
    }

    const userMsg = await db
        .insert(messages)
        .values({ conversationId: convId, role: "user", content })
        .returning();

    await db
        .update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, convId));

    const prevMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, convId))
        .orderBy(messages.createdAt);

    const conversationHistory = prevMessages.map((m) => ({
        role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
        content: m.content,
    }));

    const { routerResult, agentResult } = await processMessage(content, userId, conversationHistory);

    const routerMsg = await db
        .insert(messages)
        .values({
            conversationId: convId,
            role: routerResult.role,
            content: routerResult.content,
            agentName: routerResult.agentName,
        })
        .returning();

    const agentMsg = await db
        .insert(messages)
        .values({
            conversationId: convId,
            role: agentResult.role,
            content: agentResult.content,
            agentName: agentResult.agentName,
            data: agentResult.data || null,
        })
        .returning();

    return c.json(
        {
            userMessage: { ...userMsg[0], createdAt: userMsg[0].createdAt.toISOString() },
            agentMessages: [
                { ...routerMsg[0], createdAt: routerMsg[0].createdAt.toISOString() },
                { ...agentMsg[0], createdAt: agentMsg[0].createdAt.toISOString() },
            ],
            conversationId: convId,
        },
        200
    );
});

// ── GET /conversations ───────────────────────────────────
app.openapi(listConversationsRoute, async (c) => {
    const userId = c.get("userId");

    const convs = await db
        .select()
        .from(conversations)
        .where(eq(conversations.userId, userId))
        .orderBy(desc(conversations.updatedAt));

    return c.json(
        convs.map((conv) => ({
            ...conv,
            createdAt: conv.createdAt.toISOString(),
            updatedAt: conv.updatedAt.toISOString(),
        })),
        200
    );
});

// ── GET /conversations/:id ───────────────────────────────
app.openapi(getConversationRoute, async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");

    const conv = await db
        .select()
        .from(conversations)
        .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));

    if (conv.length === 0) {
        return c.json({ message: "Conversation not found" }, 404);
    }

    const msgs = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, id))
        .orderBy(messages.createdAt);

    return c.json(
        {
            ...conv[0],
            createdAt: conv[0].createdAt.toISOString(),
            updatedAt: conv[0].updatedAt.toISOString(),
            messages: msgs.map((m) => ({
                ...m,
                createdAt: m.createdAt.toISOString(),
            })),
        },
        200
    );
});

// ── DELETE /conversations/:id ────────────────────────────
app.openapi(deleteConversationRoute, async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");

    const conv = await db
        .select()
        .from(conversations)
        .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));

    if (conv.length === 0) {
        return c.json({ message: "Conversation not found" }, 404);
    }

    await db.delete(conversations).where(eq(conversations.id, id));

    return c.json({ message: "Conversation deleted successfully" }, 200);
});

export default app;
