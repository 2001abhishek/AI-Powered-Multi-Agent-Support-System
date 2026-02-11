
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { sign } from "hono/jwt";

const SECRET = process.env.JWT_SECRET || "supersecretkey";

export class AuthService {
    async login(email: string) {
        const userList = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (userList.length === 0) {
            // Auto-signup for demo
            return await this.signup(email, email.split('@')[0]);
        }
        const user = userList[0];
        // @ts-ignore
        const token = await sign({ id: user.id, email: user.email, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 }, SECRET);
        return { user, token };
    }

    async signup(email: string, name: string) {
        const result = await db.insert(users).values({ email, name }).returning();
        const user = result[0];
        // @ts-ignore
        const token = await sign({ id: user.id, email: user.email, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 }, SECRET);
        return { user, token };
    }
}

export const authService = new AuthService();
