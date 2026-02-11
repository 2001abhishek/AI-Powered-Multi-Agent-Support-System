
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { sign } from 'hono/jwt';

const auth = new Hono();

const signupSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

auth.post('/signup', zValidator('json', signupSchema), async (c) => {
    const { name, email, password } = c.req.valid('json');

    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    if (existingUser.length > 0) {
        return c.json({ error: 'User already exists' }, 400);
    }

    // Create user (Note: In production, hash password!)
    const [user] = await db.insert(users).values({
        name,
        email,
        password, // TODO: Hash this
    }).returning();

    const token = await sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'secret');

    return c.json({ user: { id: user.id, name: user.name, email: user.email }, token });
});

auth.post('/login', zValidator('json', loginSchema), async (c) => {
    const { email, password } = c.req.valid('json');

    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user || user.password !== password) {
        return c.json({ error: 'Invalid credentials' }, 401);
    }

    const token = await sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'secret');

    return c.json({ user: { id: user.id, name: user.name, email: user.email }, token });
});

export default auth;
