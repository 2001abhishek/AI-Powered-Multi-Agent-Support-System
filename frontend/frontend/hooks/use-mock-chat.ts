
"use client";

import { useState, useCallback } from 'react';
import { Message, AgentType } from '@/lib/chat-types';
import { v4 as uuidv4 } from 'uuid';

export function useMockChat() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'router',
            content: "Welcome to Swades AI Support. How can I help you today?",
            timestamp: new Date(),
            agentName: 'Router System',
            status: 'done'
        }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const [activeAgent, setActiveAgent] = useState<AgentType>('router');
    const [thinkingText, setThinkingText] = useState<string | null>(null);

    const addMessage = (message: Message) => {
        setMessages(prev => [...prev, message]);
    };

    const simulateResponse = useCallback(async (userQuery: string) => {
        setIsTyping(true);

        // 1. Router analyzes
        setActiveAgent('router');
        setThinkingText('Router is analyzing your request...');
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Determine agent based on keywords (mock logic)
        let targetAgent: AgentType = 'support';
        let agentName = 'Support Agent';
        let responseText = "I can help with that.";
        let responseData = undefined;

        const query = userQuery.toLowerCase();
        if (query.includes('order') || query.includes('tracking') || query.includes('delivery')) {
            targetAgent = 'order';
            agentName = 'Order Agent';
            responseText = "I've located your order. It's currently in transit.";
            responseData = {
                type: 'order',
                content: {
                    id: '#ORDER-9283',
                    status: 'In Transit',
                    items: ['Wireless Headphones', 'Protective Case'],
                    total: '$249.00',
                    eta: 'Tomorrow by 8 PM'
                }
            };
        } else if (query.includes('bill') || query.includes('refund') || query.includes('charge') || query.includes('invoice')) {
            targetAgent = 'billing';
            agentName = 'Billing Agent';
            responseText = "I can certainly help you with your billing inquiry. Here is your latest invoice.";
            responseData = {
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
            };
        }

        // 2. Transition to specific agent
        setThinkingText(`Delegating to ${agentName}...`);
        await new Promise(resolve => setTimeout(resolve, 1000));

        setActiveAgent(targetAgent);
        setThinkingText(`${agentName} is typing...`); // Or generic typing state
        setThinkingText(null); // Clear specific text, just show typing bubbles if preferred

        await new Promise(resolve => setTimeout(resolve, 1500));

        const responseMsg: Message = {
            id: uuidv4(),
            role: targetAgent,
            content: responseText,
            timestamp: new Date(),
            agentName: agentName,
            status: 'done',
            data: responseData as any
        };

        addMessage(responseMsg);
        setIsTyping(false);
        setActiveAgent('router'); // Reset to router for next turn or keep active? usually router intercepts next
    }, []);

    const sendMessage = (content: string) => {
        const newUserMsg: Message = {
            id: uuidv4(),
            role: 'user',
            content,
            timestamp: new Date(),
            status: 'done'
        };
        addMessage(newUserMsg);
        simulateResponse(content);
    };

    return {
        messages,
        isTyping,
        activeAgent,
        thinkingText,
        sendMessage
    };
}
