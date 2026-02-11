
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendIcon } from "lucide-react";

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
    const [input, setInput] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = () => {
        if (input.trim()) {
            onSend(input);
            setInput("");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="p-4 border-t bg-background/50 backdrop-blur-sm">
            <div className="relative flex items-end gap-2 max-w-4xl mx-auto">
                <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message here..."
                    className="min-h-[50px] max-h-[200px] resize-none pr-12 py-3 bg-background border-muted focus:ring-primary/20 transition-all font-sans"
                    disabled={disabled}
                />
                <Button
                    onClick={handleSend}
                    disabled={!input.trim() || disabled}
                    size="icon"
                    className="absolute right-2 bottom-2 h-8 w-8 rounded-full transition-transform active:scale-95"
                >
                    <SendIcon className="h-4 w-4" />
                    <span className="sr-only">Send</span>
                </Button>
            </div>
            <p className="text-[10px] text-center mt-2 text-muted-foreground">
                AI responses may appear in turns as different agents process your request.
            </p>
        </div>
    );
}
