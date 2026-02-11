
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

    // TODO: This is where the multi-agent system will process the message
    // For now, return a mock agent response
    const mockAgentRole = determineMockAgent(content);
    const mockResponse = getMockResponse(mockAgentRole, content);

    const agentMsg = await db
        .insert(messages)
        .values({
            conversationId: convId,
            role: mockAgentRole.role,
            content: mockResponse.text,
            agentName: mockAgentRole.name,
            data: mockResponse.data || null,
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

// ── Mock Agent Logic (placeholder for AI SDK) ────────────
function determineMockAgent(content: string): { role: string; name: string } {
    const query = content.toLowerCase();
    if (query.includes("order") || query.includes("tracking") || query.includes("delivery")) {
        return { role: "order", name: "Order Agent" };
    }
    if (query.includes("bill") || query.includes("refund") || query.includes("charge") || query.includes("invoice")) {
        return { role: "billing", name: "Billing Agent" };
    }
    return { role: "support", name: "Support Agent" };
}

function getMockResponse(agent: { role: string; name: string }, content: string): { text: string; data?: any } {
    switch (agent.role) {
        case "order":
            return {
                text: "I've located your order. Here are the details:",
                data: {
                    type: "order",
                    content: {
                        id: "#ORDER-9283",
                        status: "In Transit",
                        items: ["Wireless Headphones", "Protective Case"],
                        total: "$249.00",
                        eta: "Tomorrow by 8 PM",
                    },
                },
            };
        case "billing":
            return {
                text: "Here is your latest invoice information:",
                data: {
                    type: "invoice",
                    content: {
                        id: "INV-2024-001",
                        date: "Feb 10, 2024",
                        amount: "$249.00",
                        status: "Paid",
                        items: [
                            { desc: "Premium Plan (Monthly)", amount: "$99.00" },
                            { desc: "AI Credits Pack", amount: "$150.00" },
                        ],
                    },
                },
            };
        default:
            return {
                text: "I'd be happy to help you with that. Could you please provide more details about your issue so I can assist you better?",
            };
    }
}

export default app;
