
import { createRoute, z } from "@hono/zod-openapi";

// ── Schemas ──────────────────────────────────────────────

const MessageSchema = z.object({
    id: z.string(),
    conversationId: z.string(),
    role: z.string(),
    content: z.string(),
    agentName: z.string().nullable().optional(),
    data: z.any().nullable().optional(),
    createdAt: z.string(),
});

const ConversationSchema = z.object({
    id: z.string(),
    userId: z.string(),
    title: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

const ConversationWithMessagesSchema = ConversationSchema.extend({
    messages: z.array(MessageSchema),
});

const SendMessageSchema = z.object({
    conversationId: z.string().optional(), // If empty, creates a new conversation
    content: z.string().min(1),
});

const ErrorSchema = z.object({
    message: z.string(),
});

// ── Route Definitions ────────────────────────────────────

// POST /messages — Send new message
export const sendMessageRoute = createRoute({
    method: "post",
    path: "/messages",
    tags: ["Chat"],
    security: [{ BearerAuth: [] }],
    request: {
        body: {
            content: {
                "application/json": {
                    schema: SendMessageSchema,
                },
            },
        },
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: z.object({
                        userMessage: MessageSchema,
                        agentMessages: z.array(MessageSchema),
                        conversationId: z.string(),
                    }),
                },
            },
            description: "Message sent and agent responded",
        },
        401: {
            content: { "application/json": { schema: ErrorSchema } },
            description: "Unauthorized",
        },
    },
});

// GET /conversations — List user conversations
export const listConversationsRoute = createRoute({
    method: "get",
    path: "/conversations",
    tags: ["Chat"],
    security: [{ BearerAuth: [] }],
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: z.array(ConversationSchema),
                },
            },
            description: "List of user conversations",
        },
        401: {
            content: { "application/json": { schema: ErrorSchema } },
            description: "Unauthorized",
        },
    },
});

// GET /conversations/:id — Get conversation history
export const getConversationRoute = createRoute({
    method: "get",
    path: "/conversations/{id}",
    tags: ["Chat"],
    security: [{ BearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string(),
        }),
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: ConversationWithMessagesSchema,
                },
            },
            description: "Conversation with messages",
        },
        404: {
            content: { "application/json": { schema: ErrorSchema } },
            description: "Conversation not found",
        },
    },
});

// DELETE /conversations/:id — Delete conversation
export const deleteConversationRoute = createRoute({
    method: "delete",
    path: "/conversations/{id}",
    tags: ["Chat"],
    security: [{ BearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string(),
        }),
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: z.object({ message: z.string() }),
                },
            },
            description: "Conversation deleted",
        },
        404: {
            content: { "application/json": { schema: ErrorSchema } },
            description: "Conversation not found",
        },
    },
});
