
import { useEffect, useRef } from 'react';
import { Message } from "@/lib/chat-types";
import { MessageBubble } from "./message-bubble";

interface MessageListProps {
    messages: Message[];
    isTyping?: boolean;
    thinkingText?: string | null;
}

export function MessageList({ messages, isTyping, thinkingText }: MessageListProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping, thinkingText]);

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
            ))}

            {thinkingText && (
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg max-w-fit animate-pulse text-muted-foreground text-sm">
                    <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"></span>
                    </div>
                    <span>{thinkingText}</span>
                </div>
            )}

            <div ref={bottomRef} className="pt-2" />
        </div>
    );
}
