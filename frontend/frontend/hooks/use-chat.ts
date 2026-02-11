
"use client";

import { useState, useCallback, useRef } from "react";
import { Message, AgentType } from "@/lib/chat-types";
import { sendMessageStreamAPI, listConversationsAPI, getConversationAPI, deleteConversationAPI } from "@/utils/apis/chat";
import type { ConversationResponse } from "@/utils/apis/chat";

// Rotating thinking phrases for visual flair
const THINKING_PHRASES = [
    "Router is analyzing your request...",
    "Identifying the best agent...",
    "Processing your query...",
    "Connecting to specialized agent...",
];

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
    const streamingMsgId = useRef<string | null>(null);

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

    // Send message with streaming
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
            setThinkingText(THINKING_PHRASES[Math.floor(Math.random() * THINKING_PHRASES.length)]);

            try {
                await sendMessageStreamAPI(
                    {
                        content,
                        conversationId: conversationId || undefined,
                    },
                    {
                        onConversation: (data) => {
                            if (!conversationId) {
                                setConversationId(data.conversationId);
                            }
                        },

                        onRouter: (data) => {
                            // Add the router message
                            setMessages((prev) => [
                                ...prev,
                                {
                                    id: data.id || `router-${Date.now()}`,
                                    role: "router" as AgentType,
                                    content: data.content,
                                    timestamp: new Date(data.createdAt),
                                    agentName: data.agentName || "Router",
                                    status: "done",
                                },
                            ]);
                        },

                        onAgentStart: (data) => {
                            // Create a placeholder streaming message
                            const msgId = `streaming-${Date.now()}`;
                            streamingMsgId.current = msgId;
                            setThinkingText(`${data.agentName} is typing...`);

                            setMessages((prev) => [
                                ...prev,
                                {
                                    id: msgId,
                                    role: data.role as AgentType,
                                    content: "",
                                    timestamp: new Date(),
                                    agentName: data.agentName,
                                    status: "typing",
                                },
                            ]);
                        },

                        onTextDelta: (data) => {
                            setThinkingText(null); // Clear thinking text once tokens arrive
                            // Append the delta to the streaming message
                            setMessages((prev) =>
                                prev.map((msg) =>
                                    msg.id === streamingMsgId.current
                                        ? { ...msg, content: msg.content + data.delta, status: "typing" as const }
                                        : msg
                                )
                            );
                        },

                        onRichData: (data) => {
                            // Attach rich data to the streaming message
                            setMessages((prev) =>
                                prev.map((msg) =>
                                    msg.id === streamingMsgId.current
                                        ? { ...msg, data }
                                        : msg
                                )
                            );
                        },

                        onDone: (data) => {
                            // Finalize the streaming message
                            setMessages((prev) =>
                                prev.map((msg) =>
                                    msg.id === streamingMsgId.current
                                        ? { ...msg, id: data.messageId, status: "done" as const, timestamp: new Date(data.createdAt) }
                                        : msg
                                )
                            );
                            streamingMsgId.current = null;
                            setIsTyping(false);
                            setThinkingText(null);
                            loadConversations();
                        },

                        onError: (errorMsg) => {
                            setMessages((prev) => [
                                ...prev.filter((m) => m.id !== streamingMsgId.current),
                                {
                                    id: `error-${Date.now()}`,
                                    role: "router" as AgentType,
                                    content: `Sorry, something went wrong: ${errorMsg}`,
                                    timestamp: new Date(),
                                    agentName: "System",
                                    status: "done",
                                },
                            ]);
                            streamingMsgId.current = null;
                            setIsTyping(false);
                            setThinkingText(null);
                        },
                    }
                );
            } catch (err: any) {
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
