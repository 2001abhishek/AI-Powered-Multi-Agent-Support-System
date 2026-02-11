
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { users } from "../db/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword, generateToken } from "../utils/auth";

const app = new OpenAPIHono();

// Schemas
const UserSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

const SignupSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
});

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

const AuthResponseSchema = z.object({
    token: z.string(),
    user: UserSchema,
});

const ErrorSchema = z.object({
    message: z.string(),
});

// Routes
const signupRoute = createRoute({
    method: "post",
    path: "/signup",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: SignupSchema,
                },
            },
        },
    },
    responses: {
        201: {
            content: {
                "application/json": {
                    schema: AuthResponseSchema,
                },
            },
            description: "User created successfully",
        },
        400: {
            content: {
                "application/json": {
                    schema: ErrorSchema,
                },
            },
            description: "Invalid input or user already exists",
        },
    },
});

app.openapi(signupRoute, async (c) => {
    const { name, email, password } = c.req.valid("json");

    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    if (existingUser.length > 0) {
        return c.json({ message: "User already exists" }, 400);
    }

    const hashedPassword = await hashPassword(password);
    const newUser = await db
        .insert(users)
        .values({
            name,
            email,
            password: hashedPassword,
        })
        .returning();

    if (!newUser[0]) {
        return c.json({ message: "Failed to create user" }, 400);
    }

    const token = generateToken({ id: newUser[0].id, email: newUser[0].email });

    return c.json({
        token,
        user: {
            id: newUser[0].id,
            name: newUser[0].name,
            email: newUser[0].email,
            createdAt: newUser[0].createdAt.toISOString(),
            updatedAt: newUser[0].updatedAt.toISOString(),
        },
    }, 201);
});

const loginRoute = createRoute({
    method: "post",
    path: "/login",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: LoginSchema,
                },
            },
        },
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: AuthResponseSchema,
                },
            },
            description: "Login successful",
        },
        401: {
            content: {
                "application/json": {
                    schema: ErrorSchema,
                },
            },
            description: "Invalid email or password",
        },
    },
});

app.openapi(loginRoute, async (c) => {
    const { email, password } = c.req.valid("json");

    const user = await db.select().from(users).where(eq(users.email, email));
    if (user.length === 0) {
        return c.json({ message: "Invalid email or password" }, 401);
    }

    const isValid = await comparePassword(password, user[0].password);
    if (!isValid) {
        return c.json({ message: "Invalid email or password" }, 401);
    }

    const token = generateToken({ id: user[0].id, email: user[0].email });

    return c.json({
        token,
        user: {
            id: user[0].id,
            name: user[0].name,
            email: user[0].email,
            createdAt: user[0].createdAt.toISOString(),
            updatedAt: user[0].updatedAt.toISOString(),
        },
    }, 200);
});

export default app;
