/**
 * AI Workspace Types - v1 Scaffolding
 * No backend or real AI calls are wired yet.
 */

export interface AIWorkspaceContextItem {
  id: string;
  type: "email" | "task" | "company";
  title: string;
  subtitle?: string;
  preview?: string;
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface AIDraft {
  id: string;
  title: string;
  preview: string;
  body: string;
}

export type AICanvasMode = "ask" | "draft" | "plan" | "summarize";
