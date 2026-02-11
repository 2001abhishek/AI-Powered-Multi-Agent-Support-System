
"use client";

import { MessageSquarePlus, LogOut, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import type { ConversationResponse } from "@/utils/apis/chat";

interface SidebarProps {
    className?: string;
    conversations?: ConversationResponse[];
    onSelectConversation?: (id: string) => void;
    onNewChat?: () => void;
    onDeleteConversation?: (id: string) => void;
}

export function Sidebar({
    className,
    conversations = [],
    onSelectConversation,
    onNewChat,
    onDeleteConversation,
}: SidebarProps) {
    const { user, logout } = useAuth();

    return (
        <div className={cn("w-64 border-r bg-card/50 flex flex-col", className)}>
            <div className="p-4 border-b">
                <Button
                    className="w-full justify-start gap-2"
                    variant="outline"
                    onClick={onNewChat}
                >
                    <MessageSquarePlus className="w-4 h-4" />
                    New Chat
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
                <div className="px-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    History
                </div>
                {conversations.length === 0 && (
                    <p className="px-4 text-xs text-muted-foreground/60">No conversations yet</p>
                )}
                {conversations.map((chat) => (
                    <div
                        key={chat.id}
                        className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors group flex items-center gap-2 cursor-pointer"
                        onClick={() => onSelectConversation?.(chat.id)}
                    >
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                                {chat.title}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                                {new Date(chat.updatedAt).toLocaleDateString()}
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteConversation?.(chat.id);
                            }}
                        >
                            <Trash2 className="w-3 h-3" />
                        </Button>
                    </div>
                ))}
            </div>

            <div className="p-4 border-t space-y-3">
                {user && (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                            {user.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{user.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                        </div>
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
                    onClick={logout}
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </Button>
            </div>
        </div>
    );
}
