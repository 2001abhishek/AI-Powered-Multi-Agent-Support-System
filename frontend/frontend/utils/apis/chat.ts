
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem("swades_token");
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

// ── Send Message ─────────────────────────────────────────
export interface SendMessagePayload {
    content: string;
    conversationId?: string;
}

export interface MessageResponse {
    id: string;
    conversationId: string;
    role: string;
    content: string;
    agentName?: string;
    data?: any;
    createdAt: string;
}

export interface SendMessageResponse {
    userMessage: MessageResponse;
    agentMessages: MessageResponse[];
    conversationId: string;
}

export async function sendMessageAPI(payload: SendMessagePayload): Promise<SendMessageResponse> {
    const res = await fetch(`${API_BASE}/api/chat/messages`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to send message");
    }

    return res.json();
}

// ── Stream Message (SSE) ─────────────────────────────────
export interface StreamCallbacks {
    onConversation?: (data: { conversationId: string }) => void;
    onRouter?: (data: MessageResponse) => void;
    onAgentStart?: (data: { role: string; agentName: string }) => void;
    onTextDelta?: (data: { delta: string }) => void;
    onRichData?: (data: any) => void;
    onDone?: (data: { messageId: string; createdAt: string }) => void;
    onError?: (error: string) => void;
}

export async function sendMessageStreamAPI(
    payload: SendMessagePayload,
    callbacks: StreamCallbacks
): Promise<void> {
    const res = await fetch(`${API_BASE}/api/chat/messages/stream`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to send message");
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response stream");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        let currentEvent = "";
        let currentData = "";

        for (const line of lines) {
            if (line.startsWith("event: ")) {
                currentEvent = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
                currentData = line.slice(6).trim();
            } else if (line === "" && currentEvent && currentData) {
                // End of an SSE event block
                try {
                    const parsed = JSON.parse(currentData);
                    switch (currentEvent) {
                        case "conversation":
                            callbacks.onConversation?.(parsed);
                            break;
                        case "router":
                            callbacks.onRouter?.(parsed);
                            break;
                        case "agent_start":
                            callbacks.onAgentStart?.(parsed);
                            break;
                        case "text_delta":
                            callbacks.onTextDelta?.(parsed);
                            break;
                        case "rich_data":
                            callbacks.onRichData?.(parsed);
                            break;
                        case "done":
                            callbacks.onDone?.(parsed);
                            break;
                        case "error":
                            callbacks.onError?.(parsed.message);
                            break;
                    }
                } catch (e) {
                    // skip malformed JSON
                }
                currentEvent = "";
                currentData = "";
            }
        }
    }
}

// ── List Conversations ───────────────────────────────────
export interface ConversationResponse {
    id: string;
    userId: string;
    title: string;
    createdAt: string;
    updatedAt: string;
}

export async function listConversationsAPI(): Promise<ConversationResponse[]> {
    const res = await fetch(`${API_BASE}/api/chat/conversations`, {
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to load conversations");
    }

    return res.json();
}

// ── Get Conversation with Messages ───────────────────────
export interface ConversationDetailResponse extends ConversationResponse {
    messages: MessageResponse[];
}

export async function getConversationAPI(id: string): Promise<ConversationDetailResponse> {
    const res = await fetch(`${API_BASE}/api/chat/conversations/${id}`, {
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to load conversation");
    }

    return res.json();
}

// ── Delete Conversation ──────────────────────────────────
export async function deleteConversationAPI(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/chat/conversations/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete conversation");
    }
}
