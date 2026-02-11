
import { Hono } from "hono";
import { agentController } from "../controllers/agent.controller";

export const agentRouter = new Hono();

agentRouter.get("/", agentController.getAgents);
agentRouter.get("/:type/capabilities", agentController.getAgentCapabilities);
