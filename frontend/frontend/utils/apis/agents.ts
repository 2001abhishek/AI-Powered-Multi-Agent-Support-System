
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem("swades_token");
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

// ── Agent Types ──────────────────────────────────────────
export interface Agent {
    type: string;
    name: string;
    description: string;
    status: string;
}

export interface AgentCapability {
    type: string;
    name: string;
    description: string;
    capabilities: string[];
    tools: { name: string; description: string }[];
}

// ── List Agents ──────────────────────────────────────────
export async function listAgentsAPI(): Promise<Agent[]> {
    const res = await fetch(`${API_BASE}/api/agents`, {
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to load agents");
    }

    return res.json();
}

// ── Get Agent Capabilities ───────────────────────────────
export async function getAgentCapabilitiesAPI(type: string): Promise<AgentCapability> {
    const res = await fetch(`${API_BASE}/api/agents/${type}/capabilities`, {
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to load agent capabilities");
    }

    return res.json();
}
