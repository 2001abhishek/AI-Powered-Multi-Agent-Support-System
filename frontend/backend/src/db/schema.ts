
import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";

// ── Users ────────────────────────────────────────────────
export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Conversations ────────────────────────────────────────
export const conversations = pgTable("conversations", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text("title").default("New Chat"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Messages ─────────────────────────────────────────────
export const messages = pgTable("messages", {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // 'user' | 'router' | 'support' | 'order' | 'billing'
    content: text("content").notNull(),
    agentName: text("agent_name"),
    data: jsonb("data"), // Rich data (order card, invoice card, etc.)
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Orders (for Order Agent tools) ───────────────────────
export const orders = pgTable("orders", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    orderNumber: text("order_number").notNull().unique(),
    status: text("status").notNull().default("pending"), // pending, processing, shipped, in_transit, delivered, cancelled
    items: jsonb("items").notNull(), // Array of { name, quantity, price }
    total: text("total").notNull(),
    trackingNumber: text("tracking_number"),
    eta: text("eta"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Payments (for Billing Agent tools) ───────────────────
export const payments = pgTable("payments", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    invoiceNumber: text("invoice_number").notNull().unique(),
    amount: text("amount").notNull(),
    status: text("status").notNull().default("paid"), // paid, pending, refunded, failed
    items: jsonb("items").notNull(), // Array of { desc, amount }
    date: text("date").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
