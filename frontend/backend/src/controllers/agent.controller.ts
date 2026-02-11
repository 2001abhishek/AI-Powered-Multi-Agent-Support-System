
import { Context } from "hono";
import { agentService } from "../services/agent.service";

export class AgentController {
    getAgents(c: Context) {
        const agents = agentService.getAllAgents();
        return c.json(agents);
    }

    getAgentCapabilities(c: Context) {
        const type = c.req.param("type");
        const capabilities = agentService.getAgentCapabilities(type);
        if (!capabilities.length) return c.json({ error: "Agent not found" }, 404);
        return c.json({ type, capabilities });
    }
}

export const agentController = new AgentController();
