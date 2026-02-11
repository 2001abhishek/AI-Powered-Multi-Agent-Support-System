
import { Context, Next } from "hono";

// ── In-Memory Rate Limiter ───────────────────────────────
// Configurable sliding-window rate limiter using a Map

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

interface RateLimitConfig {
    windowMs: number;    // Time window in milliseconds
    maxRequests: number; // Max requests per window
    message?: string;    // Custom error message
}

// Store: IP -> { count, resetAt }
const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 60s to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
        if (now > entry.resetAt) {
            store.delete(key);
        }
    }
}, 60_000);

export function rateLimiter(config: RateLimitConfig) {
    const {
        windowMs,
        maxRequests,
        message = "Too many requests, please try again later.",
    } = config;

    return async (c: Context, next: Next) => {
        // Use IP + path prefix as key for granular limits
        const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";
        const key = `${ip}`;

        const now = Date.now();
        const entry = store.get(key);

        if (!entry || now > entry.resetAt) {
            // New window
            store.set(key, { count: 1, resetAt: now + windowMs });
            setRateLimitHeaders(c, maxRequests, maxRequests - 1, now + windowMs);
            await next();
            return;
        }

        entry.count++;

        if (entry.count > maxRequests) {
            const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
            setRateLimitHeaders(c, maxRequests, 0, entry.resetAt);
            c.header("Retry-After", String(retryAfter));

            return c.json(
                {
                    message,
                    retryAfter,
                },
                429
            );
        }

        setRateLimitHeaders(c, maxRequests, maxRequests - entry.count, entry.resetAt);
        await next();
    };
}

function setRateLimitHeaders(c: Context, limit: number, remaining: number, resetAt: number) {
    c.header("X-RateLimit-Limit", String(limit));
    c.header("X-RateLimit-Remaining", String(Math.max(0, remaining)));
    c.header("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));
}

// ── Preset Configurations ────────────────────────────────

// General API: 100 req / 1 min
export const apiRateLimit = rateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 100,
    message: "Too many API requests. Please wait a moment and try again.",
});

// Auth endpoints: 10 req / 1 min (stricter to prevent brute force)
export const authRateLimit = rateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 10,
    message: "Too many login/signup attempts. Please wait a minute and try again.",
});

// Chat/AI endpoints: 20 req / 1 min (AI calls are expensive)
export const chatRateLimit = rateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 20,
    message: "Too many messages. Please slow down and try again shortly.",
});
