
export type AgentType = 'user' | 'router' | 'support' | 'order' | 'billing';

export interface Message {
    id: string;
    role: AgentType;
    content: string;
    timestamp: Date;
    status?: 'thinking' | 'typing' | 'done';
    agentName?: string; // e.g., "Billing Agent", "Router"
    data?: {
        type: 'order' | 'invoice' | 'tracking';
        content: any;
    };
}

export interface Conversation {
    id: string;
    title: string;
    date: Date;
    preview: string;
}

// Mock initial data
export const INITIAL_CONVERSATIONS: Conversation[] = [
    {
        id: '1',
        title: 'Order status inquiry',
        date: new Date(Date.now() - 1000 * 60 * 60 * 2),
        preview: 'Where is my order #12345?',
    },
    {
        id: '2',
        title: 'Billing question',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24),
        preview: 'I was charged twice for my subscription.',
    },
];
