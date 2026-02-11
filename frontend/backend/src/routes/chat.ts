
import { OpenAPIHono } from "@hono/zod-openapi";
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
import { processMessage } from "../agents";

const app = new OpenAPIHono();

// Apply auth middleware to all chat routes
app.use("/*", authMiddleware);

// ── POST /messages ───────────────────────────────────────
app.openapi(sendMessageRoute, async (c) => {
    const userId = c.get("userId");
    const { conversationId, content } = c.req.valid("json");

    let convId = conversationId;

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
    const userMsg = await db
        .insert(messages)
        .values({
            conversationId: convId,
            role: "user",
            content,
        })
        .returning();

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

    const conversationHistory = prevMessages
        .filter((m) => m.role === "user" || m.role !== "user")
        .map((m) => ({
            role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
            content: m.content,
        }));

    // Process through multi-agent system
    const { routerResult, agentResult } = await processMessage(content, userId, conversationHistory);

    // Save router message
    const routerMsg = await db
        .insert(messages)
        .values({
            conversationId: convId,
            role: routerResult.role,
            content: routerResult.content,
            agentName: routerResult.agentName,
        })
        .returning();

    // Save agent response
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
            userMessage: {
                ...userMsg[0],
                createdAt: userMsg[0].createdAt.toISOString(),
            },
            agentMessages: [
                {
                    ...routerMsg[0],
                    createdAt: routerMsg[0].createdAt.toISOString(),
                },
                {
                    ...agentMsg[0],
                    createdAt: agentMsg[0].createdAt.toISOString(),
                },
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

    // Messages will cascade delete due to FK constraint
    await db.delete(conversations).where(eq(conversations.id, id));

    return c.json({ message: "Conversation deleted successfully" }, 200);
});

export default app;
