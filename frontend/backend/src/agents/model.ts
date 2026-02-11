
import { gateway } from "@ai-sdk/gateway";

// Create a model instance via Vercel AI Gateway
// The gateway reads AI_GATEWAY_API_KEY from process.env automatically
export const model = gateway("openai/gpt-4o-mini");
