
export const AGENTS = [
    {
        type: "router",
        name: "Router Agent",
        description: "Analyzes intent and delegates to specialized agents.",
        capabilities: ["intent_classification", "delegation"]
    },
    {
        type: "support",
        name: "Support Agent",
        description: "Handles general inquiries and troubleshooting.",
        capabilities: ["faq_search", "conversation_history"]
    },
    {
        type: "order",
        name: "Order Agent",
        description: "Manages order tracking and details.",
        capabilities: ["fetch_order", "check_status"]
    },
    {
        type: "billing",
        name: "Billing Agent",
        description: "Handles invoices and refunds.",
        capabilities: ["fetch_invoice", "check_refund"]
    }
];

export class AgentService {
    getAllAgents() {
        return AGENTS;
    }

    getAgentCapabilities(type: string) {
        const agent = AGENTS.find(a => a.type === type);
        return agent ? agent.capabilities : [];
    }
}

export const agentService = new AgentService();
