
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Auth API ─────────────────────────────────────────────

interface AuthResponse {
    token: string;
    user: {
        id: string;
        name: string;
        email: string;
        createdAt: string;
        updatedAt: string;
    };
}

interface ErrorResponse {
    message: string;
}

export async function loginAPI(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
        const error: ErrorResponse = await res.json();
        throw new Error(error.message || "Login failed");
    }

    return res.json();
}

export async function signupAPI(name: string, email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
        const error: ErrorResponse = await res.json();
        throw new Error(error.message || "Signup failed");
    }

    return res.json();
}

export async function logoutAPI(): Promise<void> {
    const token = localStorage.getItem("swades_token");
    await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });
}
