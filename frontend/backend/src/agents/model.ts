
import { createGroq } from "@ai-sdk/groq";

// Groq provider — reads GROQ_API_KEY from .env by default
// Using llama-3.3-70b-versatile for good tool-calling support
const groq = createGroq({
    apiKey: process.env.GROQ_API_KEY || process.env.GROQ_API,
});

export const model = groq("llama-3.3-70b-versatile");
