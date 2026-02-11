
import { pgTable, text, timestamp, uuid, jsonb, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    password: text('password').notNull(), // Hashed
    createdAt: timestamp('created_at').defaultNow(),
});

export const conversations = pgTable('conversations', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    title: text('title').notNull(),
    preview: text('preview'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const messages = pgTable('messages', {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id').references(() => conversations.id).notNull(),
    role: text('role').notNull(), // 'user', 'router', 'support', 'order', 'billing'
    content: text('content').notNull(),
    agentName: text('agent_name'),
    data: jsonb('data'), // For rich content { type: 'order', content: ... }
    createdAt: timestamp('created_at').defaultNow(),
});
