
"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
    id: string;
    name: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string) => Promise<void>;
    signup: (email: string, name: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Check local storage for mock session
        const storedUser = localStorage.getItem("swades_user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email: string) => {
        setLoading(true);
        // Mock login delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const mockUser = {
            id: "user_123",
            name: email.split("@")[0],
            email,
        };
        setUser(mockUser);
        localStorage.setItem("swades_user", JSON.stringify(mockUser));
        setLoading(false);
        router.push("/");
    };

    const signup = async (email: string, name: string) => {
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const mockUser = {
            id: "user_123", // In real app, this would be new ID
            name,
            email,
        };
        setUser(mockUser);
        localStorage.setItem("swades_user", JSON.stringify(mockUser));
        setLoading(false);
        router.push("/");
    }

    const logout = () => {
        setUser(null);
        localStorage.removeItem("swades_user");
        router.push("/login");
    };

    // Protect routes
    useEffect(() => {
        if (!loading && !user && pathname !== "/login" && pathname !== "/signup") {
            router.push("/login");
        }
    }, [user, loading, pathname, router]);

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
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
