
import { db } from "../db";
import { users, orders, payments, conversations, messages } from "../db/schema";
import { hashPassword } from "../utils/auth";

export async function seedDatabase() {
    console.log("🌱 Seeding database...");

    // ── Seed Users ───────────────────────────────────────
    const hashedPw = await hashPassword("password123");

    const [demoUser] = await db
        .insert(users)
        .values({
            name: "Demo User",
            email: "demo@swades.ai",
            password: hashedPw,
        })
        .onConflictDoNothing()
        .returning();

    if (!demoUser) {
        console.log("ℹ️  Demo user already exists, skipping seed.");
        return;
    }

    const userId = demoUser.id;

    // ── Seed Orders ──────────────────────────────────────
    await db.insert(orders).values([
        {
            userId,
            orderNumber: "ORD-9283",
            status: "in_transit",
            items: [
                { name: "Wireless Headphones", quantity: 1, price: "$199.00" },
                { name: "Protective Case", quantity: 1, price: "$50.00" },
            ],
            total: "$249.00",
            trackingNumber: "TRK-8827364",
            eta: "Tomorrow by 8 PM",
        },
        {
            userId,
            orderNumber: "ORD-7451",
            status: "delivered",
            items: [
                { name: "USB-C Hub", quantity: 1, price: "$79.00" },
                { name: "HDMI Cable", quantity: 2, price: "$30.00" },
            ],
            total: "$109.00",
            trackingNumber: "TRK-5529102",
            eta: "Delivered",
        },
        {
            userId,
            orderNumber: "ORD-3120",
            status: "processing",
            items: [
                { name: "Mechanical Keyboard", quantity: 1, price: "$149.00" },
            ],
            total: "$149.00",
            trackingNumber: null,
            eta: "3-5 business days",
        },
        {
            userId,
            orderNumber: "ORD-6699",
            status: "cancelled",
            items: [
                { name: "Monitor Stand", quantity: 1, price: "$89.00" },
            ],
            total: "$89.00",
            trackingNumber: null,
            eta: null,
        },
    ]);

    // ── Seed Payments ────────────────────────────────────
    await db.insert(payments).values([
        {
            userId,
            invoiceNumber: "INV-2024-001",
            amount: "$249.00",
            status: "paid",
            items: [
                { desc: "Premium Plan (Monthly)", amount: "$99.00" },
                { desc: "AI Credits Pack", amount: "$150.00" },
            ],
            date: "Feb 10, 2024",
        },
        {
            userId,
            invoiceNumber: "INV-2024-002",
            amount: "$99.00",
            status: "paid",
            items: [
                { desc: "Premium Plan (Monthly)", amount: "$99.00" },
            ],
            date: "Jan 10, 2024",
        },
        {
            userId,
            invoiceNumber: "INV-2024-003",
            amount: "$45.00",
            status: "refunded",
            items: [
                { desc: "AI Credits Pack (Small)", amount: "$45.00" },
            ],
            date: "Dec 15, 2023",
        },
        {
            userId,
            invoiceNumber: "INV-2024-004",
            amount: "$199.00",
            status: "pending",
            items: [
                { desc: "Enterprise Upgrade", amount: "$199.00" },
            ],
            date: "Feb 11, 2024",
        },
    ]);

    // ── Seed a Conversation ──────────────────────────────
    const [conv] = await db
        .insert(conversations)
        .values({
            userId,
            title: "Order tracking inquiry",
        })
        .returning();

    await db.insert(messages).values([
        {
            conversationId: conv.id,
            role: "user",
            content: "Where is my order ORD-9283?",
        },
        {
            conversationId: conv.id,
            role: "router",
            content: "I see you're asking about an order. Let me connect you with our Order Agent.",
            agentName: "Router",
        },
        {
            conversationId: conv.id,
            role: "order",
            content: "I've found your order ORD-9283. It's currently in transit and expected to arrive tomorrow by 8 PM.",
            agentName: "Order Agent",
            data: {
                type: "order",
                content: {
                    id: "ORD-9283",
                    status: "In Transit",
                    items: ["Wireless Headphones", "Protective Case"],
                    total: "$249.00",
                    eta: "Tomorrow by 8 PM",
                },
            },
        },
    ]);

    console.log("✅ Database seeded successfully!");
    console.log(`   Demo user: demo@swades.ai / password123`);
}
