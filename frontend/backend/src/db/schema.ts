
import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id").references(() => conversations.id).notNull(),
    role: text("role").notNull(), // 'user', 'router', 'support', etc.
    content: text("content").notNull(),
    data: jsonb("data"), // For rich content like orders, invoices
    agentName: text("agent_name"),
    createdAt: timestamp("created_at").defaultNow(),
});
