
import { Context } from "hono";
import { chatService } from "../services/chat.service";

export class ChatController {
    async getConversations(c: Context) {
        const payload = c.get('jwtPayload') as any;
        console.log('JWT Payload:', payload);
        const userId = payload?.id;
        console.log('Extracted userId:', userId);
        
        if (!userId) return c.json({ error: "Unauthorized" }, 401);

        const convos = await chatService.getConversations(userId);
        return c.json(convos);
    }

    async getConversation(c: Context) {
        const id = c.req.param("id");
        const convo = await chatService.getConversation(id);
        if (!convo) return c.json({ error: "Not found" }, 404);
        return c.json(convo);
    }

    async sendMessage(c: Context) {
        const { conversationId, content, userId } = await c.req.json();
        if (!content) return c.json({ error: "Content required" }, 400);

        let convoId = conversationId;
        if (!convoId) {
            if (!userId) return c.json({ error: "User ID required for new conversation" }, 400);
            const newConvo = await chatService.createConversation(userId, content.substring(0, 30) + "...");
            convoId = newConvo.id;
        }

        // Save user message
        const userMsg = await chatService.addMessage(convoId, "user", content);

        // TODO: Implement Agent Routing Logic here or call AgentService
        // For now, mock router response
        const routerMsg = await chatService.addMessage(convoId, "router", "Analyzing request...");

        return c.json({
            userMessage: userMsg,
            conversationId: convoId,
            response: routerMsg
        });
    }

    async deleteConversation(c: Context) {
        const id = c.req.param("id");
        await chatService.deleteConversation(id);
        return c.json({ success: true });
    }
}

export const chatController = new ChatController();
