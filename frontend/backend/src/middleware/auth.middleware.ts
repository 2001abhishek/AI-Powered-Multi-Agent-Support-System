
import { Context, Next } from 'hono';
import { sign, verify } from 'hono/jwt';
import { JWT_SECRET } from '../env';

export const authMiddleware = async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
        return c.json({ error: 'Unauthorized: Missing Authorization header' }, 401);
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>
    if (!token) {
        return c.json({ error: 'Unauthorized: Invalid token format' }, 401);
    }

    try {
        const payload = await verify(token, JWT_SECRET, 'HS256');
        c.set('jwtPayload', payload);
        await next();
    } catch (err) {
        console.error('JWT verification error:', err);
        return c.json({ error: 'Unauthorized: Invalid token' }, 401);
    }
}
