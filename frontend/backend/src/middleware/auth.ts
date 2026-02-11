
import { Context, Next } from "hono";
import { verifyToken } from "../utils/auth";

// Extend Hono's context to include user info
declare module "hono" {
    interface ContextVariableMap {
        userId: string;
        userEmail: string;
    }
}

export const authMiddleware = async (c: Context, next: Next) => {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json({ message: "Unauthorized: No token provided" }, 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token) as { id: string; email: string } | null;

    if (!decoded) {
        return c.json({ message: "Unauthorized: Invalid or expired token" }, 401);
    }

    // Attach user info to context for downstream handlers
    c.set("userId", decoded.id);
    c.set("userEmail", decoded.email);

    await next();
};
