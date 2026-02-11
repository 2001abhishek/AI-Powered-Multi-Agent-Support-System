
"use client";

import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { Sidebar } from "./sidebar";
import { useMockChat } from "@/hooks/use-mock-chat";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export function ChatLayout() {
    const { messages, isTyping, thinkingText, sendMessage } = useMockChat();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] max-w-6xl mx-auto border rounded-xl shadow-2xl overflow-hidden bg-card/50 backdrop-blur-xl">
            {/* Sidebar for Desktop */}
            <Sidebar className="hidden md:flex" />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="p-4 border-b bg-card text-card-foreground flex items-center gap-3">
                    <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="w-5 h-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-72">
                            <Sidebar className="w-full h-full border-none" />
                        </SheetContent>
                    </Sheet>

                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold font-serif text-xl border border-primary/30">
                        S
                    </div>
                    <div>
                        <h1 className="font-bold text-lg font-serif tracking-tight">Swades AI Support</h1>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            All Systems Operational
                        </p>
                    </div>
                </header>

                {/* Messages */}
                <MessageList
                    messages={messages}
                    isTyping={isTyping}
                    thinkingText={thinkingText}
                />

                {/* Input */}
                <ChatInput onSend={sendMessage} disabled={isTyping} />
            </div>
        </div>
    );
}
