
"use client";

import { useState, useCallback } from "react";
import { Message, AgentType } from "@/lib/chat-types";
import { sendMessageAPI, listConversationsAPI, getConversationAPI, deleteConversationAPI } from "@/utils/apis/chat";
import type { ConversationResponse } from "@/utils/apis/chat";

export function useChat() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "router",
            content: "Welcome to Swades AI Support. How can I help you today?",
            timestamp: new Date(),
            agentName: "Router System",
            status: "done",
        },
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const [thinkingText, setThinkingText] = useState<string | null>(null);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [conversations, setConversations] = useState<ConversationResponse[]>([]);

    // Load all conversations for sidebar
    const loadConversations = useCallback(async () => {
        try {
            const convs = await listConversationsAPI();
            setConversations(convs);
        } catch (err) {
            console.error("Failed to load conversations:", err);
        }
    }, []);

    // Load a specific conversation's messages
    const loadConversation = useCallback(async (id: string) => {
        try {
            const conv = await getConversationAPI(id);
            setConversationId(id);
            setMessages(
                conv.messages.map((m) => ({
                    id: m.id,
                    role: m.role as AgentType,
                    content: m.content,
                    timestamp: new Date(m.createdAt),
                    agentName: m.agentName || undefined,
                    data: m.data || undefined,
                    status: "done" as const,
                }))
            );
        } catch (err) {
            console.error("Failed to load conversation:", err);
        }
    }, []);

    // Start a new chat
    const newChat = useCallback(() => {
        setConversationId(null);
        setMessages([
            {
                id: "welcome",
                role: "router",
                content: "Welcome to Swades AI Support. How can I help you today?",
                timestamp: new Date(),
                agentName: "Router System",
                status: "done",
            },
        ]);
    }, []);

    // Delete a conversation
    const deleteConversation = useCallback(async (id: string) => {
        try {
            await deleteConversationAPI(id);
            setConversations((prev) => prev.filter((c) => c.id !== id));
            if (conversationId === id) {
                newChat();
            }
        } catch (err) {
            console.error("Failed to delete conversation:", err);
        }
    }, [conversationId, newChat]);

    // Send a message to the backend
    const sendMessage = useCallback(
        async (content: string) => {
            // Add user message immediately
            const userMsg: Message = {
                id: `user-${Date.now()}`,
                role: "user",
                content,
                timestamp: new Date(),
                status: "done",
            };
            setMessages((prev) => [...prev, userMsg]);

            setIsTyping(true);
            setThinkingText("Router is analyzing your request...");

            try {
                const response = await sendMessageAPI({
                    content,
                    conversationId: conversationId || undefined,
                });

                // Update conversation ID if new
                if (!conversationId) {
                    setConversationId(response.conversationId);
                }

                // Add agent messages to the UI
                const agentMessages: Message[] = response.agentMessages.map((m) => ({
                    id: m.id,
                    role: m.role as AgentType,
                    content: m.content,
                    timestamp: new Date(m.createdAt),
                    agentName: m.agentName || undefined,
                    data: m.data || undefined,
                    status: "done" as const,
                }));

                setMessages((prev) => [...prev, ...agentMessages]);

                // Refresh conversations list
                loadConversations();
            } catch (err: any) {
                // Show error as a system message
                setMessages((prev) => [
                    ...prev,
                    {
                        id: `error-${Date.now()}`,
                        role: "router" as AgentType,
                        content: `Sorry, something went wrong: ${err.message}`,
                        timestamp: new Date(),
                        agentName: "System",
                        status: "done",
                    },
                ]);
            } finally {
                setIsTyping(false);
                setThinkingText(null);
            }
        },
        [conversationId, loadConversations]
    );

    return {
        messages,
        isTyping,
        thinkingText,
        conversations,
        conversationId,
        sendMessage,
        loadConversations,
        loadConversation,
        newChat,
        deleteConversation,
    };
}
