/**
 * Build Task Note from Email
 *
 * Creates clean initial notes from extracted email data,
 * explicitly avoiding raw email body with signatures and disclaimers.
 */

import type { InboxItem } from "@/types/inbox";

interface KeyPoint {
  text?: string;
  content?: string;
}

/**
 * Build a clean initial note from extracted email data.
 * Prioritizes AI-extracted content over raw body text.
 */
export function buildTaskNoteFromEmail(item: InboxItem): string {
  const parts: string[] = [];

  // Prefer AI summary
  if (item.extractedSummary) {
    parts.push(item.extractedSummary);
  }

  // Add next step if actionable
  if (item.extractedNextStep?.isActionRequired && item.extractedNextStep?.label) {
    parts.push(`Next step: ${item.extractedNextStep.label}`);
  }

  // Add key points (first 3)
  if (item.extractedKeyPoints && item.extractedKeyPoints.length > 0) {
    const topPoints = item.extractedKeyPoints.slice(0, 3);
    const formattedPoints = topPoints
      .map((p: string | KeyPoint) => {
        if (typeof p === "string") return `- ${p}`;
        if (typeof p === "object" && p !== null) {
          return `- ${p.text || p.content || ""}`;
        }
        return null;
      })
      .filter(Boolean);
    
    if (formattedPoints.length > 0) {
      parts.push(formattedPoints.join("\n"));
    }
  }

  // Fallback to cleaned text snippet (not raw body)
  if (parts.length === 0 && item.cleanedText) {
    const snippet = item.cleanedText.slice(0, 300).trim();
    if (snippet) {
      parts.push(snippet + (item.cleanedText.length > 300 ? "..." : ""));
    }
  }

  // Last resort: use display snippet
  if (parts.length === 0 && item.displaySnippet) {
    parts.push(item.displaySnippet);
  }

  return parts.join("\n\n").trim();
}

/**
 * Build a short summary for commitment context
 */
export function buildCommitmentContextFromEmail(item: InboxItem): string {
  if (item.extractedSummary) {
    return item.extractedSummary;
  }
  if (item.displaySnippet) {
    return item.displaySnippet;
  }
  if (item.cleanedText) {
    return item.cleanedText.slice(0, 200).trim() + "...";
  }
  return "";
}
