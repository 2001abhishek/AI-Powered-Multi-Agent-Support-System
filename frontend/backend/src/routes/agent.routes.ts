
import { Hono } from "hono";
import { agentController } from "../controllers/agent.controller";
import { authMiddleware } from "../middleware/auth.middleware";

export const agentRouter = new Hono();

agentRouter.use('/*', authMiddleware);

agentRouter.get("/", agentController.getAgents);
agentRouter.get("/:type/capabilities", agentController.getAgentCapabilities);
