
import { MessageSquarePlus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { INITIAL_CONVERSATIONS } from "@/lib/chat-types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export function Sidebar({ className }: { className?: string }) {
    return (
        <div className={cn("w-64 border-r bg-card/50 flex flex-col", className)}>
            <div className="p-4 border-b">
                <Button className="w-full justify-start gap-2" variant="outline">
                    <MessageSquarePlus className="w-4 h-4" />
                    New Chat
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
                <div className="px-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    History
                </div>
                {INITIAL_CONVERSATIONS.map((chat) => (
                    <button
                        key={chat.id}
                        className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors group"
                    >
                        <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                            {chat.title}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                            {chat.preview}
                        </div>
                    </button>
                ))}
            </div>

            <div className="p-4 border-t text-xs text-center text-muted-foreground">
                Swades AI v1.0
            </div>
        </div>
    );
}
