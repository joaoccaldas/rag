import Groq from "groq-sdk";

// Initialize Groq client with API key from environment variables
export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

// Helper function to call Groq chat completion
export async function chatCompletion({
  messages,
  model = "llama-3.1-70b-versatile",
  temperature = 0.7,
  maxTokens = 1024,
}: {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}) {
  const response = await groq.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  });
  
  return response.choices[0]?.message?.content || "";
}
