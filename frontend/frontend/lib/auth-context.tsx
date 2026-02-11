
"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { loginAPI, signupAPI, logoutAPI } from "@/utils/apis/auth";

interface User {
    id: string;
    name: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    // Restore session from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem("swades_user");
        const storedToken = localStorage.getItem("swades_token");
        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser));
            setToken(storedToken);
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await loginAPI(email, password);
            setUser(data.user);
            setToken(data.token);
            localStorage.setItem("swades_user", JSON.stringify(data.user));
            localStorage.setItem("swades_token", data.token);
            router.push("/");
        } catch (err: any) {
            setError(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    const signup = async (name: string, email: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await signupAPI(name, email, password);
            setUser(data.user);
            setToken(data.token);
            localStorage.setItem("swades_user", JSON.stringify(data.user));
            localStorage.setItem("swades_token", data.token);
            router.push("/");
        } catch (err: any) {
            setError(err.message || "Signup failed");
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        logoutAPI();
        setUser(null);
        setToken(null);
        localStorage.removeItem("swades_user");
        localStorage.removeItem("swades_token");
        router.push("/login");
    };

    const clearError = () => setError(null);

    // Protect routes
    useEffect(() => {
        if (!loading && !user && pathname !== "/login" && pathname !== "/signup") {
            router.push("/login");
        }
    }, [user, loading, pathname, router]);

    return (
        <AuthContext.Provider value={{ user, token, loading, error, login, signup, logout, clearError }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
