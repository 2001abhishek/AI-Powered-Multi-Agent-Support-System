
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db';
import { conversations, messages } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

const chat = new Hono();

// Schemas
const createConversationSchema = z.object({
    userId: z.string(),
    title: z.string(),
});

const sendMessageSchema = z.object({
    conversationId: z.string(),
    content: z.string(),
    role: z.enum(['user', 'router', 'support', 'order', 'billing']),
});

// Routes

// Get all conversations for a user
chat.get('/conversations', async (c) => {
    const userId = c.req.query('userId');
    if (!userId) return c.json({ error: 'userId is required' }, 400);

    const userConversations = await db.select()
        .from(conversations)
        .where(eq(conversations.userId, userId))
        .orderBy(desc(conversations.createdAt));

    return c.json(userConversations);
});

// Get specific conversation with messages
chat.get('/conversations/:id', async (c) => {
    const id = c.req.param('id');

    const conversation = await db.select().from(conversations).where(eq(conversations.id, id));
    if (conversation.length === 0) return c.json({ error: 'Conversation not found' }, 404);

    const conversationMessages = await db.select()
        .from(messages)
        .where(eq(messages.conversationId, id))
        .orderBy(messages.createdAt);

    return c.json({ conversation: conversation[0], messages: conversationMessages });
});



// Delete conversation
chat.delete('/conversations/:id', async (c) => {
    const id = c.req.param('id');

    // Delete messages first (foreign key constraint)
    await db.delete(messages).where(eq(messages.conversationId, id));

    const result = await db.delete(conversations)
        .where(eq(conversations.id, id))
        .returning();

    if (result.length === 0) return c.json({ error: 'Conversation not found' }, 404);

    return c.json({ success: true, id });
});

// Create new conversation
chat.post('/conversations', zValidator('json', createConversationSchema), async (c) => {
    const { userId, title } = c.req.valid('json');

    const [newConv] = await db.insert(conversations).values({
        userId,
        title,
        preview: 'New conversation started',
    }).returning();

    return c.json(newConv);
});

// Send message (User -> API -> DB)
// This is where we would trigger the Agent System
chat.post('/messages', zValidator('json', sendMessageSchema), async (c) => {
    const { conversationId, content, role } = c.req.valid('json');

    // 1. Save User Message
    const [userMsg] = await db.insert(messages).values({
        conversationId,
        content,
        role,
    }).returning();

    // 2. Trigger Agent Response (MOCKED FOR NOW - TO BE EXPANDED)
    // In a real system, this would be a background job or a stream
    // For this assessment, we'll return the user message and letting the frontend know it's "processing"
    // Or we can mock the router response here directly if we want a simple request/response.

    // Let's create a placeholder "Router" response to simulate the system acknowledging
    /*
    const [routerMsg] = await db.insert(messages).values({
      conversationId,
      content: "Processing your request...",
      role: "router",
      agentName: "Router System"
    }).returning();
    */

    return c.json({ message: userMsg });
});

export default chat;
