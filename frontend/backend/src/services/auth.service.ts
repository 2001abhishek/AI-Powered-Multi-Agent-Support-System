
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

export class AuthService {
    async login(email: string) {
        const userList = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (userList.length === 0) {
            // Auto-signup for demo
            return await this.signup(email, email.split('@')[0]);
        }
        return userList[0];
    }

    async signup(email: string, name: string) {
        const result = await db.insert(users).values({ email, name }).returning();
        return result[0];
    }
}

export const authService = new AuthService();
