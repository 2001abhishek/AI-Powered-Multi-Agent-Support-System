
import { Hono } from "hono";
import { chatController } from "../controllers/chat.controller";
import { authMiddleware } from "../middleware/auth.middleware";

export const chatRouter = new Hono();

chatRouter.use('/*', authMiddleware);

chatRouter.get("/conversations", chatController.getConversations);
chatRouter.get("/conversations/:id", chatController.getConversation);
chatRouter.post("/messages", chatController.sendMessage);
chatRouter.delete("/conversations/:id", chatController.deleteConversation);
