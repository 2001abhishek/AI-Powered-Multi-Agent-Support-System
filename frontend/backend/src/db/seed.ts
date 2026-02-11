
import { db } from "./index";
import { users, conversations, messages } from "./schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Seeding database...");

    const userEmail = "rayabhishek9438@gmail.com";
    const userName = "Abhishek Ray";

    // 1. Create or Get User
    let user = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
    let userId: string;

    if (user.length === 0) {
        console.log("Creating user:", userEmail);
        const newUser = await db.insert(users).values({
            name: userName,
            email: userEmail,
            // Note: In a real app, we'd hash the password here if we stored it. 
            // For this assessment, we're using a simple email-based flow or external auth.
            // If we need password auth, we should add a password column to the schema.
            // Assuming for now the 'login' just checks email existence as per current auth service.
        }).returning();
        userId = newUser[0].id;
    } else {
        console.log("User already exists:", userEmail);
        userId = user[0].id;
    }

    // 2. Create Conversations
    // Conversation 1: Order Inquiry
    const convo1 = await db.insert(conversations).values({
        userId,
        title: "Order #ORDER-9283 Status",
    }).returning();

    await db.insert(messages).values([
        {
            conversationId: convo1[0].id,
            role: "user",
            content: "Where is my order #ORDER-9283?",
        },
        {
            conversationId: convo1[0].id,
            role: "router",
            content: "Let me check with the Order Agent.",
            agentName: "Router System"
        },
        {
            conversationId: convo1[0].id,
            role: "order",
            content: "I've located your order. It's currently in transit.",
            agentName: "Order Agent",
            data: {
                type: 'order',
                content: {
                    id: '#ORDER-9283',
                    status: 'In Transit',
                    items: ['Wireless Headphones', 'Protective Case'],
                    total: '$249.00',
                    eta: 'Tomorrow by 8 PM'
                }
            }
        }
    ]);

    // Conversation 2: Billing Inquiry
    const convo2 = await db.insert(conversations).values({
        userId,
        title: "Billing Question",
    }).returning();

    await db.insert(messages).values([
        {
            conversationId: convo2[0].id,
            role: "user",
            content: "I need my latest invoice.",
        },
        {
            conversationId: convo2[0].id,
            role: "router",
            content: "Delegating to Billing Agent...",
            agentName: "Router System"
        },
        {
            conversationId: convo2[0].id,
            role: "billing",
            content: "Here is your latest invoice for February.",
            agentName: "Billing Agent",
            data: {
                type: 'invoice',
                content: {
                    id: 'INV-2024-001',
                    date: 'Feb 10, 2024',
                    amount: '$249.00',
                    status: 'Paid',
                    items: [
                        { desc: 'Premium Plan (Monthly)', amount: '$99.00' },
                        { desc: 'AI Credits Pack', amount: '$150.00' }
                    ]
                }
            }
        }
    ]);

    console.log("Seeding complete!");
    process.exit(0);
}

main().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
