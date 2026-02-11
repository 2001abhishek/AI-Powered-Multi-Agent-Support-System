
import { db } from './index';
import { users, conversations, messages } from './schema';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
    console.log('🌱 Seeding database...');

    // 1. Create a dummy user
    const userId = uuidv4();
    await db.insert(users).values({
        id: userId,
        name: 'Demo User',
        email: 'demo@swades.ai',
        password: '$2y$10$wD7AYY9Vsy.aZCjLX/L.7.XQSqMAEw69BoTm50E.Ix7i.20sdQdq6', // In real app, hash this!
    });

    console.log('👤 Created User: demo@swades.ai');

    // 2. Create a conversation
    const convId = uuidv4();
    await db.insert(conversations).values({
        id: convId,
        userId: userId,
        title: 'Order Status Inquiry',
        preview: 'Where is my order #12345?',
    });

    console.log('💬 Created Conversation');

    // 3. Create messages
    await db.insert(messages).values([
        {
            conversationId: convId,
            role: 'user',
            content: 'Where is my order #12345?',
        },
        {
            conversationId: convId,
            role: 'router',
            content: 'I can help with that. Let me check the status.',
            agentName: 'Router System',
        },
        {
            conversationId: convId,
            role: 'order',
            content: 'I found your order #12345. It is currently in transit.',
            agentName: 'Order Agent',
            data: {
                type: 'order',
                content: {
                    id: '#12345',
                    status: 'In Transit',
                    items: ['Wireless Headphones'],
                    total: '$249.00',
                    eta: 'Tomorrow by 8 PM'
                }
            }
        }
    ]);

    console.log('✅ Seeding complete!');
    process.exit(0);
}

seed().catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
});
