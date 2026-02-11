import { createRoute, z } from "@hono/zod-openapi";

// ── Schemas ──────────────────────────────────────────────
export const UserSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const SignupSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
});

export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const AuthResponseSchema = z.object({
    token: z.string(),
    user: UserSchema,
});

export const ErrorSchema = z.object({
    message: z.string(),
});

// ── Route Definitions ────────────────────────────────────
export const signupRoute = createRoute({
    method: "post",
    path: "/signup",
    tags: ["Auth"],
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

export const loginRoute = createRoute({
    method: "post",
    path: "/login",
    tags: ["Auth"],
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

export const logoutRoute = createRoute({
    method: "post",
    path: "/logout",
    tags: ["Auth"],
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: z.object({
                        message: z.string(),
                    }),
                },
            },
            description: "Logout successful",
        },
    },
});
