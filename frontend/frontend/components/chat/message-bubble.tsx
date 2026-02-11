
import { cn } from "@/lib/utils";
import { Message, AgentType } from "@/lib/chat-types";
import { Bot, User, ShoppingCart, CreditCard, LifeBuoy } from "lucide-react";
import { OrderCard } from "./order-card";
import { InvoiceCard } from "./invoice-card";

interface MessageBubbleProps {
    message: Message;
}

const agentIcons = {
    user: User,
    router: Bot,
    support: LifeBuoy,
    order: ShoppingCart,
    billing: CreditCard,
};

const agentStyles = {
    user: "bg-primary text-primary-foreground self-end ml-12 shadow-primary/20",
    router: "bg-muted text-foreground self-start mr-12 border-l-4 border-l-muted-foreground/40",
    support: "bg-blue-100/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 self-start mr-12 border-l-4 border-l-blue-500",
    order: "bg-orange-100/50 dark:bg-orange-950/30 text-orange-900 dark:text-orange-100 self-start mr-12 border-l-4 border-l-orange-500",
    billing: "bg-green-100/50 dark:bg-green-950/30 text-green-900 dark:text-green-100 self-start mr-12 border-l-4 border-l-green-500",
};

export function MessageBubble({ message }: MessageBubbleProps) {
    const isUser = message.role === 'user';
    const Icon = agentIcons[message.role];

    return (
        <div className={cn("flex flex-col gap-1 mb-4", isUser ? "items-end" : "items-start")}>
            <div className="flex items-center gap-2 mb-1 px-1">
                {!isUser && Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
                <span className="text-xs font-medium text-muted-foreground capitalize">
                    {message.agentName || message.role}
                </span>
                <span className="text-[10px] text-muted-foreground/60">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>

            <div className={cn(
                "rounded-lg p-3 max-w-[80%] shadow-sm",
                agentStyles[message.role] || agentStyles.router
            )}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                    {message.status === 'typing' && (
                        <span className="inline-block w-1.5 h-4 ml-0.5 bg-current animate-pulse rounded-sm align-text-bottom" />
                    )}
                </p>

                {message.data?.type === 'order' && <OrderCard data={message.data.content} />}
                {message.data?.type === 'invoice' && <InvoiceCard data={message.data.content} />}
            </div>
        </div>
    );
}
