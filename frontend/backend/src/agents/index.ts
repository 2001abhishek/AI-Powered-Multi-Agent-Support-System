
import { generateText, stepCountIs } from "ai";
import { model } from "./model";
import {
    queryConversationHistory,
    fetchOrderDetails,
    checkDeliveryStatus,
    getInvoiceDetails,
    checkRefundStatus,
} from "./tools";

// ── Agent Definitions ────────────────────────────────────
interface AgentResult {
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
You handle general support inquiries, FAQs, and troubleshooting.
Be helpful, concise, and professional. Use the queryConversationHistory tool when you need context from previous interactions.
If the user's query requires order or billing assistance, suggest they ask about those specific topics.`;

const ORDER_SYSTEM_PROMPT = `You are the Order Agent for Swades AI Customer Support.
You handle order status lookups, tracking, modifications, and cancellations.
Use the fetchOrderDetails tool to look up orders and checkDeliveryStatus to check delivery status.
Always provide clear, structured information about orders. Be helpful and proactive.`;

const BILLING_SYSTEM_PROMPT = `You are the Billing Agent for Swades AI Customer Support.
You handle payment issues, refunds, invoices, and subscription queries.
Use the getInvoiceDetails tool to look up invoices and checkRefundStatus to check refund status.
Always provide clear, structured information about billing. Be helpful and proactive.`;

// ── Router Agent ─────────────────────────────────────────
async function routeQuery(userMessage: string): Promise<string> {
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

        // Fallback: keyword-based routing
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

// ── Sub-Agent Execution ──────────────────────────────────
async function runSubAgent(
    agentType: string,
    userMessage: string,
    userId: string,
    conversationHistory: { role: "user" | "assistant"; content: string }[]
): Promise<AgentResult> {
    const agentConfig = {
        support: {
            system: SUPPORT_SYSTEM_PROMPT,
            tools: { queryConversationHistory },
            name: "Support Agent",
        },
        order: {
            system: ORDER_SYSTEM_PROMPT,
            tools: { fetchOrderDetails, checkDeliveryStatus },
            name: "Order Agent",
        },
        billing: {
            system: BILLING_SYSTEM_PROMPT,
            tools: { getInvoiceDetails, checkRefundStatus },
            name: "Billing Agent",
        },
    };

    const config = agentConfig[agentType as keyof typeof agentConfig] || agentConfig.support;

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

        // Extract tool result data for rich UI rendering
        let richData = null;
        for (const step of result.steps) {
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

// ── Main Orchestrator ────────────────────────────────────
export async function processMessage(
    userMessage: string,
    userId: string,
    conversationHistory: { role: "user" | "assistant"; content: string }[] = []
): Promise<{ routerResult: AgentResult; agentResult: AgentResult }> {
    // Step 1: Router classifies intent
    const targetAgent = await routeQuery(userMessage);

    const routerResult: AgentResult = {
        role: "router",
        agentName: "Router",
        content: `I'll connect you with our ${targetAgent.charAt(0).toUpperCase() + targetAgent.slice(1)} Agent to assist you.`,
    };

    // Step 2: Run the appropriate sub-agent with tools
    const agentResult = await runSubAgent(targetAgent, userMessage, userId, conversationHistory);

    return { routerResult, agentResult };
}
