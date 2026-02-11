
import { generateText, streamText, stepCountIs } from "ai";
import { model } from "./model";
import {
    queryConversationHistory,
    fetchOrderDetails,
    lookupByTrackingNumber,
    checkDeliveryStatus,
    cancelOrder,
    createOrder,
    getInvoiceDetails,
    checkRefundStatus,
} from "./tools";

// ── Agent Definitions ────────────────────────────────────
export interface AgentResult {
    role: string;
    agentName: string;
    content: string;
    data?: any;
    reasoning?: string;
}

// Router agent system prompt
const ROUTER_SYSTEM_PROMPT = `You are the Router Agent for Swades AI Customer Support.
Your job is to analyze incoming customer queries and determine which specialized agent should handle them.

The available agents are:
1. **Support Agent** - Handles general support inquiries, FAQs, and troubleshooting
2. **Order Agent** - Handles order status, tracking, modifications, and cancellations
3. **Billing Agent** - Handles payment issues, refunds, invoices, and subscription queries

Respond with a brief analysis of the query and which agent to delegate to.
Format your response as:
DELEGATE_TO: [support|order|billing]
ANALYSIS: [Your brief analysis]

If the query is unclear, default to the Support Agent.`;

// Sub-agent system prompts
const SUPPORT_SYSTEM_PROMPT = `You are the Support Agent for Swades AI Customer Support.

YOUR CAPABILITIES:
- Answer general support inquiries, FAQs, and troubleshooting questions
- Use the queryConversationHistory tool to check previous interactions when relevant

YOUR LIMITATIONS (IMPORTANT):
- You CANNOT create, modify, or cancel orders
- You CANNOT process payments, refunds, or invoices
- You CANNOT access order or billing data
- If the user asks about orders or billing, tell them: "Let me redirect you — please ask your order/billing question again and our specialized agent will help."

RULES:
- Never claim to perform actions you cannot do
- Never invent or fabricate data, order numbers, or invoice numbers
- Only state facts from your tools or general knowledge
- Be concise and professional`;

const ORDER_SYSTEM_PROMPT = `You are the Order Agent for Swades AI Customer Support.

YOUR CAPABILITIES (use ONLY these tools):
- fetchOrderDetails: Look up an existing order by its order number
- lookupByTrackingNumber: Look up an order by its tracking number (e.g. TRK-8827364)
- checkDeliveryStatus: Check delivery/tracking status of an order
- cancelOrder: Cancel an order (only works for 'processing' orders)
- createOrder: Create a new order for the user with specified items

YOUR LIMITATIONS (CRITICAL):
- You CANNOT modify existing order items or amounts
- If an order is not found, say so honestly — do NOT make up order details
- When creating an order, you MUST use the createOrder tool — never claim you created one without using the tool

RULES:
- Always use a tool before responding about an order — never guess
- When the user wants to create a new order, ask for item details (name, quantity, price) if not provided, then use createOrder
- Be concise and provide clear, structured information`;

const BILLING_SYSTEM_PROMPT = `You are the Billing Agent for Swades AI Customer Support.

YOUR CAPABILITIES (use ONLY these tools):
- getInvoiceDetails: Look up an invoice by its invoice number
- checkRefundStatus: Check the refund status of an invoice

YOUR LIMITATIONS (CRITICAL):
- You CANNOT create invoices or process new payments
- You CANNOT issue refunds — you can only CHECK refund status
- You can ONLY work with existing invoices in the database
- If an invoice is not found, say so honestly — do NOT make up data

RULES:
- Always use a tool before responding about billing — never guess
- Be concise and provide clear, structured information`;

// ── Agent Config Map ─────────────────────────────────────
const AGENT_CONFIG = {
    support: {
        system: SUPPORT_SYSTEM_PROMPT,
        tools: { queryConversationHistory },
        name: "Support Agent",
    },
    order: {
        system: ORDER_SYSTEM_PROMPT,
        tools: { fetchOrderDetails, lookupByTrackingNumber, checkDeliveryStatus, cancelOrder, createOrder },
        name: "Order Agent",
    },
    billing: {
        system: BILLING_SYSTEM_PROMPT,
        tools: { getInvoiceDetails, checkRefundStatus },
        name: "Billing Agent",
    },
};

// ── Router Agent ─────────────────────────────────────────
export async function routeQuery(userMessage: string): Promise<string> {
    try {
        const result = await generateText({
            model,
            system: ROUTER_SYSTEM_PROMPT,
            prompt: userMessage,
        });

        const text = result.text;
        const delegateMatch = text.match(/DELEGATE_TO:\s*(support|order|billing)/i);

        if (delegateMatch) {
            return delegateMatch[1].toLowerCase();
        }

        return fallbackRoute(userMessage);
    } catch (error) {
        console.error("Router agent error, using fallback:", error);
        return fallbackRoute(userMessage);
    }
}

function fallbackRoute(message: string): string {
    const query = message.toLowerCase();
    if (query.includes("order") || query.includes("tracking") || query.includes("delivery") || query.includes("ship")) {
        return "order";
    }
    if (query.includes("bill") || query.includes("refund") || query.includes("charge") || query.includes("invoice") || query.includes("payment")) {
        return "billing";
    }
    return "support";
}

// ── Get Agent Info ───────────────────────────────────────
export function getAgentConfig(agentType: string) {
    return AGENT_CONFIG[agentType as keyof typeof AGENT_CONFIG] || AGENT_CONFIG.support;
}

// ── Non-Streaming Sub-Agent (kept for fallback) ──────────
export async function runSubAgent(
    agentType: string,
    userMessage: string,
    userId: string,
    conversationHistory: { role: "user" | "assistant"; content: string }[]
): Promise<AgentResult> {
    const config = getAgentConfig(agentType);

    try {
        const result = await generateText({
            model,
            system: config.system,
            messages: [
                ...conversationHistory,
                { role: "user" as const, content: userMessage },
            ],
            tools: config.tools,
            stopWhen: stepCountIs(5),
        });

        const richData = extractRichData(result.steps);

        return {
            role: agentType,
            agentName: config.name,
            content: result.text || "I've processed your request. Is there anything else I can help with?",
            data: richData,
            reasoning: result.steps.length > 1 ? `Used ${result.steps.length} steps to process your request.` : undefined,
        };
    } catch (error) {
        console.error(`${config.name} error:`, error);
        return {
            role: agentType,
            agentName: config.name,
            content: "I'm sorry, I encountered an issue while processing your request. Please try again.",
        };
    }
}

// ── Streaming Sub-Agent ──────────────────────────────────
export function streamSubAgent(
    agentType: string,
    userMessage: string,
    conversationHistory: { role: "user" | "assistant"; content: string }[]
) {
    const config = getAgentConfig(agentType);

    const result = streamText({
        model,
        system: config.system,
        messages: [
            ...conversationHistory,
            { role: "user" as const, content: userMessage },
        ],
        tools: config.tools,
        stopWhen: stepCountIs(5),
        onError: (error) => {
            console.error(`${config.name} stream error:`, error);
        },
    });

    return {
        textStream: result.textStream,
        result, // Full stream result for awaiting completion
        agentName: config.name,
        role: agentType,
    };
}

// ── Extract Rich Data from Tool Steps ────────────────────
export function extractRichData(steps: any[]): any {
    let richData = null;
    for (const step of steps) {
        if (!step.toolResults) continue;
        for (const toolResult of step.toolResults) {
            const resultValue = (toolResult as any).result as any;
            if (resultValue?.found && resultValue?.order) {
                richData = {
                    type: "order",
                    content: {
                        id: resultValue.order.id,
                        status: resultValue.order.status,
                        items: Array.isArray(resultValue.order.items)
                            ? resultValue.order.items.map((i: any) => i.name || i)
                            : [],
                        total: resultValue.order.total,
                        eta: resultValue.order.eta,
                    },
                };
            }
            if (resultValue?.found && resultValue?.invoice) {
                richData = {
                    type: "invoice",
                    content: {
                        id: resultValue.invoice.id,
                        date: resultValue.invoice.date,
                        amount: resultValue.invoice.amount,
                        status: resultValue.invoice.status,
                        items: resultValue.invoice.items,
                    },
                };
            }
        }
    }
    return richData;
}

// ── Main Orchestrator (Non-Streaming, kept for backward compat) ──
export async function processMessage(
    userMessage: string,
    userId: string,
    conversationHistory: { role: "user" | "assistant"; content: string }[] = []
): Promise<{ routerResult: AgentResult; agentResult: AgentResult }> {
    const targetAgent = await routeQuery(userMessage);

    const routerResult: AgentResult = {
        role: "router",
        agentName: "Router",
        content: `I'll connect you with our ${targetAgent.charAt(0).toUpperCase() + targetAgent.slice(1)} Agent to assist you.`,
    };

    const agentResult = await runSubAgent(targetAgent, userMessage, userId, conversationHistory);

    return { routerResult, agentResult };
}
