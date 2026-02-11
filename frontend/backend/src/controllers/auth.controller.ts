
import { Context } from "hono";
import { authService } from "../services/auth.service";

export class AuthController {
    async login(c: Context) {
        const { email } = await c.req.json();
        if (!email) return c.json({ error: "Email required" }, 400);

        const user = await authService.login(email);
        return c.json(user);
    }

    async signup(c: Context) {
        const { email, name } = await c.req.json();
        if (!email || !name) return c.json({ error: "Email and name required" }, 400);

        const user = await authService.signup(email, name);
        return c.json(user);
    }
}

export const authController = new AuthController();
