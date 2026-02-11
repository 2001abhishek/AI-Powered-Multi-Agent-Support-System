
import { OpenAPIHono } from "@hono/zod-openapi";
import { listAgentsRoute, getAgentCapabilitiesRoute } from "../api/agents";

const app = new OpenAPIHono();

// ── Static Agent Data ────────────────────────────────────
const AGENTS = [
    {
        type: "router",
        name: "Router Agent",
        description: "Analyzes incoming customer queries and delegates to the appropriate specialized agent",
        status: "active",
    },
    {
        type: "support",
        name: "Support Agent",
        description: "Handles general support inquiries, FAQs, and troubleshooting",
        status: "active",
    },
    {
        type: "order",
        name: "Order Agent",
        description: "Handles order status, tracking, modifications, and cancellations",
        status: "active",
    },
    {
        type: "billing",
        name: "Billing Agent",
        description: "Handles payment issues, refunds, invoices, and subscription queries",
        status: "active",
    },
];

const AGENT_CAPABILITIES: Record<string, any> = {
    router: {
        type: "router",
        name: "Router Agent",
        description: "Analyzes queries and delegates to specialized sub-agents",
        capabilities: [
            "Intent classification",
            "Query analysis",
            "Agent delegation",
            "Fallback handling",
        ],
        tools: [],
    },
    support: {
        type: "support",
        name: "Support Agent",
        description: "Handles general support inquiries",
        capabilities: [
            "FAQ answers",
            "Troubleshooting guides",
            "General inquiries",
        ],
        tools: [
            { name: "queryConversationHistory", description: "Search through past conversations for context" },
        ],
    },
    order: {
        type: "order",
        name: "Order Agent",
        description: "Handles order-related queries",
        capabilities: [
            "Order status lookup",
            "Delivery tracking",
            "Order modifications",
            "Order cancellation",
        ],
        tools: [
            { name: "fetchOrderDetails", description: "Fetch order details by order number" },
            { name: "checkDeliveryStatus", description: "Check the delivery status and ETA" },
        ],
    },
    billing: {
        type: "billing",
        name: "Billing Agent",
        description: "Handles billing and payment queries",
        capabilities: [
            "Invoice lookup",
            "Payment status",
            "Refund processing",
            "Subscription management",
        ],
        tools: [
            { name: "getInvoiceDetails", description: "Get invoice details by invoice number" },
            { name: "checkRefundStatus", description: "Check the status of a refund request" },
        ],
    },
};

// ── Handlers ─────────────────────────────────────────────

// GET /agents
app.openapi(listAgentsRoute, async (c) => {
    return c.json(AGENTS, 200);
});

// GET /agents/:type/capabilities
app.openapi(getAgentCapabilitiesRoute, async (c) => {
    const { type } = c.req.valid("param");
    const capabilities = AGENT_CAPABILITIES[type];

    if (!capabilities) {
        return c.json({ message: `Agent type '${type}' not found` }, 404);
    }

    return c.json(capabilities, 200);
});

export default app;
