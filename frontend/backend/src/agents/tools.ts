
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

export const lookupByTrackingNumber = tool({
    description: "Look up an order by its tracking number (e.g. TRK-8827364). Use this when the user provides a tracking ID instead of an order number.",
    inputSchema: z.object({
        trackingNumber: z.string().describe("The tracking number to search for, e.g., TRK-8827364"),
    }),
    execute: async ({ trackingNumber }) => {
        const order = await db
            .select()
            .from(orders)
            .where(eq(orders.trackingNumber, trackingNumber));

        if (order.length === 0) {
            return { found: false, message: `No order found with tracking number ${trackingNumber}.` };
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

export const cancelOrder = tool({
    description: "Cancel an order by order number. Use this when users want to cancel an order. Only orders that are 'processing' can be cancelled.",
    inputSchema: z.object({
        orderNumber: z.string().describe("The order number to cancel, e.g., ORD-3120"),
    }),
    execute: async ({ orderNumber }) => {
        const order = await db
            .select()
            .from(orders)
            .where(eq(orders.orderNumber, orderNumber));

        if (order.length === 0) {
            return { success: false, message: `Order ${orderNumber} not found.` };
        }

        const o = order[0];

        if (o.status === "cancelled") {
            return { success: false, message: `Order ${orderNumber} is already cancelled.` };
        }
        if (o.status === "delivered") {
            return { success: false, message: `Order ${orderNumber} has already been delivered and cannot be cancelled. Please contact support for a return.` };
        }
        if (o.status === "in_transit") {
            return { success: false, message: `Order ${orderNumber} is already in transit and cannot be cancelled. Please contact support for assistance.` };
        }

        // Cancel the order
        await db
            .update(orders)
            .set({ status: "cancelled", trackingNumber: null, eta: null })
            .where(eq(orders.orderNumber, orderNumber));

        return {
            success: true,
            message: `Order ${orderNumber} has been successfully cancelled.`,
            order: {
                id: o.orderNumber,
                status: "cancelled",
                items: o.items,
                total: o.total,
            },
        };
    },
});

export const createOrder = tool({
    description: "Create a new order for the user. Use this when users want to place a new order with specific items.",
    inputSchema: z.object({
        userId: z.string().describe("The user ID placing the order"),
        items: z.array(z.object({
            name: z.string().describe("Item name"),
            quantity: z.number().describe("Item quantity"),
            price: z.string().describe("Item price, e.g. '$99.00'"),
        })).describe("Array of items to order"),
        total: z.string().describe("Total price of the order, e.g. '$149.00'"),
    }),
    execute: async ({ userId, items, total }) => {
        // Generate unique order number
        const orderNum = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

        const [newOrder] = await db
            .insert(orders)
            .values({
                userId,
                orderNumber: orderNum,
                status: "processing",
                items,
                total,
                eta: "3-5 business days",
            })
            .returning();

        return {
            success: true,
            order: {
                id: newOrder.orderNumber,
                status: newOrder.status,
                items: newOrder.items,
                total: newOrder.total,
                eta: newOrder.eta,
                createdAt: newOrder.createdAt.toISOString(),
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
