
import { eq, desc } from "drizzle-orm";
import { db } from "../db";
import { conversations, messages } from "../db/schema";
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

const openai = createOpenAI({
    apiKey: process.env.AI_GATEWAY_API_KEY,
});

export class ChatService {
    async createConversation(userId: string, title: string) {
        const result = await db.insert(conversations).values({ userId, title }).returning();
        return result[0];
    }

    async getConversations(userId: string) {
        return await db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.createdAt));
    }

    async getConversation(id: string) {
        const convo = await db.select().from(conversations).where(eq(conversations.id, id));
        if (!convo.length) return null;

        const msgs = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(messages.createdAt);
        return { ...convo[0], messages: msgs };
    }

    async addMessage(conversationId: string, role: string, content: string, data?: any, agentName?: string) {
        const result = await db.insert(messages).values({
            conversationId,
            role,
            content,
            data,
            agentName
        }).returning();
        return result[0];
    }

    async deleteConversation(id: string) {
        await db.delete(messages).where(eq(messages.conversationId, id));
        await db.delete(conversations).where(eq(conversations.id, id));
        return { success: true };
    }
}

export const chatService = new ChatService();
