
import { Context } from "hono";
import { authService } from "../services/auth.service";

export class AuthController {
    async login(c: Context) {
        const { email } = await c.req.json();
        if (!email) return c.json({ error: "Email required" }, 400);

        const result = await authService.login(email);
        return c.json(result);
    }

    async signup(c: Context) {
        const { email, name } = await c.req.json();
        if (!email || !name) return c.json({ error: "Email and name required" }, 400);

        const result = await authService.signup(email, name);
        return c.json(result);
    }
}

export const authController = new AuthController();
