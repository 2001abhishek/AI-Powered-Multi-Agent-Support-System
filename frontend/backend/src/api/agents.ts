
import { createRoute, z } from "@hono/zod-openapi";

// ── Schemas ──────────────────────────────────────────────

const AgentSchema = z.object({
    type: z.string(),
    name: z.string(),
    description: z.string(),
    status: z.string(),
});

const AgentCapabilitiesSchema = z.object({
    type: z.string(),
    name: z.string(),
    description: z.string(),
    capabilities: z.array(z.string()),
    tools: z.array(z.object({
        name: z.string(),
        description: z.string(),
    })),
});

const ErrorSchema = z.object({
    message: z.string(),
});

// ── Route Definitions ────────────────────────────────────

// GET /agents — List available agents
export const listAgentsRoute = createRoute({
    method: "get",
    path: "/",
    tags: ["Agents"],
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: z.array(AgentSchema),
                },
            },
            description: "List of available agents",
        },
    },
});

// GET /agents/:type/capabilities — Get agent capabilities
export const getAgentCapabilitiesRoute = createRoute({
    method: "get",
    path: "/{type}/capabilities",
    tags: ["Agents"],
    request: {
        params: z.object({
            type: z.string(),
        }),
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: AgentCapabilitiesSchema,
                },
            },
            description: "Agent capabilities",
        },
        404: {
            content: { "application/json": { schema: ErrorSchema } },
            description: "Agent not found",
        },
    },
});
