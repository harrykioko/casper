/**
 * AI Workspace Stubbed Client - v1 Scaffolding
 * Returns mocked AI responses. No real network calls.
 */

import type { AIWorkspaceContextItem, AIMessage } from "./types";

const mockResponses = [
  "I've analyzed the context you provided. Based on the email thread and related tasks, here are my suggestions for moving forward.",
  "Looking at the conversation history and the company context, I can help you craft a thoughtful response that addresses all the key points.",
  "I've extracted the main action items from this thread. Would you like me to create tasks for each of them?",
  "Based on the context, here's a summary of the key discussion points and next steps.",
  "I can help you draft a professional response. Let me know if you'd like me to adjust the tone or add any specific details.",
];

export async function generateAIResponse(
  prompt: string,
  contextItems: AIWorkspaceContextItem[]
): Promise<AIMessage> {
  // Simulate network delay (600-1200ms)
  await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 600));
  
  // Pick a contextual mock response
  const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
  const contextNote = contextItems.length > 0 
    ? `\n\nI'm working with ${contextItems.length} context item(s) including: ${contextItems.map(c => c.title).join(", ")}.`
    : "";
  
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content: randomResponse + contextNote,
    createdAt: new Date().toISOString(),
  };
}
