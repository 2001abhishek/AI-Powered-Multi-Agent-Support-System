
import { createMiddleware } from 'hono/factory'
import { verify } from 'hono/jwt'

const SECRET = process.env.JWT_SECRET || "supersecretkey";

export const authMiddleware = createMiddleware(async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
        return c.json({ error: 'Unauthorized: Missing Authorization header' }, 401);
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>
    if (!token) {
        return c.json({ error: 'Unauthorized: Invalid token format' }, 401);
    }

    try {
        const payload = await verify(token, SECRET);
        // Attach user info to context (hono specific way might vary, setting header for now or using c.set)
        c.set('user', payload);
        // Also set header for downstream controllers if they rely on it
        c.req.raw.headers.set('x-user-id', payload.id as string);
        await next();
    } catch (err) {
        return c.json({ error: 'Unauthorized: Invalid token' }, 401);
    }
})
