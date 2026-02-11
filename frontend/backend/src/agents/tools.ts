
import { tool } from "ai";
import { z } from "zod";
import { db } from "../db";
import { orders, payments, messages } from "../db/schema";
import { eq, and } from "drizzle-orm";

// ══════════════════════════════════════════════════════════
//  Support Agent Tools
// ══════════════════════════════════════════════════════════

export const queryConversationHistory = tool({
    description: "Search through past conversation messages for context about previous interactions with the user",
    inputSchema: z.object({
        userId: z.string().describe("The user ID to search conversations for"),
        searchTerm: z.string().describe("The keywords to search for in conversation history"),
    }),
    execute: async ({ userId, searchTerm }) => {
        // Query messages from conversations belonging to this user
        const allMessages = await db
            .select({
                content: messages.content,
                role: messages.role,
                createdAt: messages.createdAt,
            })
            .from(messages)
            .limit(20);

        const matching = allMessages.filter((m) =>
            m.content.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (matching.length === 0) {
            return { found: false, message: "No matching conversation history found." };
        }

        return {
            found: true,
            results: matching.map((m) => ({
                role: m.role,
                content: m.content,
                date: m.createdAt.toISOString(),
            })),
        };
    },
});

// ══════════════════════════════════════════════════════════
//  Order Agent Tools
// ══════════════════════════════════════════════════════════

export const fetchOrderDetails = tool({
    description: "Fetch order details by order number. Use this when users ask about a specific order.",
    inputSchema: z.object({
        orderNumber: z.string().describe("The order number to look up, e.g., ORD-9283"),
    }),
    execute: async ({ orderNumber }) => {
        const order = await db
            .select()
            .from(orders)
            .where(eq(orders.orderNumber, orderNumber));

        if (order.length === 0) {
            return { found: false, message: `Order ${orderNumber} not found.` };
        }

        const o = order[0];
        return {
            found: true,
            order: {
                id: o.orderNumber,
                status: o.status,
                items: o.items,
                total: o.total,
                trackingNumber: o.trackingNumber,
                eta: o.eta,
                createdAt: o.createdAt.toISOString(),
            },
        };
    },
});

export const checkDeliveryStatus = tool({
    description: "Check the delivery status and estimated time of arrival for an order",
    inputSchema: z.object({
        orderNumber: z.string().describe("The order number to check delivery for"),
    }),
    execute: async ({ orderNumber }) => {
        const order = await db
            .select()
            .from(orders)
            .where(eq(orders.orderNumber, orderNumber));

        if (order.length === 0) {
            return { found: false, message: `Order ${orderNumber} not found.` };
        }

        const o = order[0];
        return {
            found: true,
            delivery: {
                orderNumber: o.orderNumber,
                status: o.status,
                trackingNumber: o.trackingNumber || "Not yet assigned",
                eta: o.eta || "Not available",
            },
        };
    },
});

// ══════════════════════════════════════════════════════════
//  Billing Agent Tools
// ══════════════════════════════════════════════════════════

export const getInvoiceDetails = tool({
    description: "Get invoice details by invoice number. Use when users ask about a specific invoice or their billing.",
    inputSchema: z.object({
        invoiceNumber: z.string().describe("The invoice number to look up, e.g., INV-2024-001"),
    }),
    execute: async ({ invoiceNumber }) => {
        const payment = await db
            .select()
            .from(payments)
            .where(eq(payments.invoiceNumber, invoiceNumber));

        if (payment.length === 0) {
            return { found: false, message: `Invoice ${invoiceNumber} not found.` };
        }

        const p = payment[0];
        return {
            found: true,
            invoice: {
                id: p.invoiceNumber,
                amount: p.amount,
                status: p.status,
                items: p.items,
                date: p.date,
            },
        };
    },
});

export const checkRefundStatus = tool({
    description: "Check the status of a refund request",
    inputSchema: z.object({
        invoiceNumber: z.string().describe("The invoice number to check refund status for"),
    }),
    execute: async ({ invoiceNumber }) => {
        const payment = await db
            .select()
            .from(payments)
            .where(eq(payments.invoiceNumber, invoiceNumber));

        if (payment.length === 0) {
            return { found: false, message: `Invoice ${invoiceNumber} not found.` };
        }

        const p = payment[0];
        return {
            found: true,
            refund: {
                invoiceNumber: p.invoiceNumber,
                amount: p.amount,
                status: p.status === "refunded" ? "Refunded" : "Not refunded",
                originalDate: p.date,
            },
        };
    },
});
