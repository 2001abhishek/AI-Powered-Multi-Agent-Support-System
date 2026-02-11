
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
