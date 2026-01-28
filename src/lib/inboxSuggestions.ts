// Heuristic-based suggestion extraction from email content

import { v4 as uuidv4 } from "uuid";

export interface SuggestedAction {
  id: string;
  title: string;
  effortMinutes: number | null;
  effortBucket: "quick" | "medium" | "long";
  confidence: "low" | "medium" | "high";
  source: "heuristic" | "ai";
  rationale: string;
  dueHint?: string;
  category?: string;
}

// Action verb patterns that suggest tasks
const ACTION_VERBS = [
  "send",
  "share",
  "schedule",
  "follow up",
  "follow-up",
  "followup",
  "intro",
  "introduce",
  "review",
  "update",
  "draft",
  "attach",
  "confirm",
  "call",
  "meet",
  "discuss",
  "check",
  "prepare",
  "submit",
  "complete",
  "reply",
  "respond",
  "reach out",
  "connect",
  "forward",
  "approve",
  "sign",
  "finalize",
];

// Deadline patterns
const DEADLINE_PATTERNS = [
  /by\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
  /by\s+(tomorrow|today|end of day|eod|end of week|eow)/i,
  /by\s+(\d{1,2}\/\d{1,2}|\d{1,2}-\d{1,2})/i,
  /before\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
  /deadline[:\s]+(.+?)(?:\.|$)/i,
  /due\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
  /due\s+(tomorrow|today)/i,
];

// Effort indicators
const LONG_EFFORT_KEYWORDS = ["meeting", "call", "discuss", "presentation", "document", "report"];
const QUICK_EFFORT_KEYWORDS = ["confirm", "reply", "respond", "forward", "approve", "sign"];

/**
 * Extract heuristic-based task suggestions from email content
 */
export function extractHeuristicSuggestions(
  subject: string,
  cleanedText: string
): SuggestedAction[] {
  const suggestions: SuggestedAction[] = [];
  const seenTitles = new Set<string>();
  
  const lines = cleanedText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

  // Check for numbered lists (highest confidence)
  const numberedItems = extractNumberedListItems(lines);
  for (const item of numberedItems) {
    if (seenTitles.has(item.toLowerCase())) continue;
    seenTitles.add(item.toLowerCase());
    suggestions.push(createSuggestion(item, "high", "Numbered list item"));
  }

  // Check for bullet points (medium confidence)
  const bulletItems = extractBulletListItems(lines);
  for (const item of bulletItems) {
    if (seenTitles.has(item.toLowerCase())) continue;
    seenTitles.add(item.toLowerCase());
    suggestions.push(createSuggestion(item, "medium", "Bullet point item"));
  }

  // Check for action verb lines (medium confidence)
  for (const line of lines) {
    if (suggestions.length >= 5) break;
    
    const actionMatch = findActionVerbMatch(line);
    if (actionMatch && !seenTitles.has(line.toLowerCase())) {
      seenTitles.add(line.toLowerCase());
      const title = formatAsTask(line, actionMatch);
      suggestions.push(createSuggestion(
        title, 
        "medium", 
        `Contains action verb: ${actionMatch}`
      ));
    }
  }

  // Check for questions requiring action (medium confidence)
  const questions = extractActionQuestions(lines);
  for (const q of questions) {
    if (suggestions.length >= 5) break;
    if (seenTitles.has(q.toLowerCase())) continue;
    seenTitles.add(q.toLowerCase());
    suggestions.push(createSuggestion(
      `Respond to: ${truncateText(q, 60)}`,
      "medium",
      "Question requiring response"
    ));
  }

  // Extract deadline hints
  for (const suggestion of suggestions) {
    const dueHint = extractDeadlineHint(suggestion.title + " " + cleanedText);
    if (dueHint) {
      suggestion.dueHint = dueHint;
    }
  }

  // If nothing found, add default follow-up suggestion
  if (suggestions.length === 0) {
    suggestions.push({
      id: uuidv4(),
      title: `Follow up on: ${truncateText(subject, 50)}`,
      effortMinutes: 5,
      effortBucket: "quick",
      confidence: "low",
      source: "heuristic",
      rationale: "No specific action items detected - default follow-up",
      category: "follow-up",
    });
  }

  return suggestions.slice(0, 5);
}

/**
 * Create a suggestion object with effort estimation
 */
function createSuggestion(
  title: string,
  confidence: "low" | "medium" | "high",
  rationale: string
): SuggestedAction {
  const { effortMinutes, effortBucket, category } = estimateEffort(title);

  return {
    id: uuidv4(),
    title: truncateText(title, 80),
    effortMinutes,
    effortBucket,
    confidence,
    source: "heuristic",
    rationale,
    category,
  };
}

/**
 * Extract numbered list items (1., 2., etc.)
 */
function extractNumberedListItems(lines: string[]): string[] {
  const items: string[] = [];
  
  for (const line of lines) {
    // Match patterns like "1.", "1)", "1-", etc.
    const match = line.match(/^\s*\d+[\.\)\-]\s*(.+)$/);
    if (match && match[1].length > 5 && match[1].length < 200) {
      items.push(match[1].trim());
    }
  }

  return items;
}

/**
 * Extract bullet point items (-, *, etc.)
 */
function extractBulletListItems(lines: string[]): string[] {
  const items: string[] = [];
  
  for (const line of lines) {
    // Match patterns like "- item", "* item", "• item"
    const match = line.match(/^\s*[\-\*\•]\s+(.+)$/);
    if (match && match[1].length > 5 && match[1].length < 200) {
      // Skip if it looks like a signature separator
      if (match[1].toLowerCase().includes("sent from")) continue;
      items.push(match[1].trim());
    }
  }

  return items;
}

/**
 * Find action verb in a line
 */
function findActionVerbMatch(line: string): string | null {
  const lowerLine = line.toLowerCase();
  
  for (const verb of ACTION_VERBS) {
    // Check if line starts with verb or contains "please [verb]" or "can you [verb]"
    if (lowerLine.startsWith(verb) || 
        lowerLine.includes(`please ${verb}`) ||
        lowerLine.includes(`can you ${verb}`) ||
        lowerLine.includes(`could you ${verb}`) ||
        lowerLine.includes(`would you ${verb}`) ||
        lowerLine.includes(`need to ${verb}`) ||
        lowerLine.includes(`want to ${verb}`)) {
      return verb;
    }
  }

  return null;
}

/**
 * Format a line as a task title
 */
function formatAsTask(line: string, actionVerb: string): string {
  // If line already starts with an imperative, keep it
  if (line.toLowerCase().startsWith(actionVerb)) {
    return capitalizeFirst(line);
  }

  // Extract the action part
  const patterns = [
    /please\s+(.+)/i,
    /can you\s+(.+)/i,
    /could you\s+(.+)/i,
    /would you\s+(.+)/i,
    /need to\s+(.+)/i,
    /want to\s+(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      return capitalizeFirst(match[1].trim());
    }
  }

  return capitalizeFirst(line);
}

/**
 * Extract questions that require action
 */
function extractActionQuestions(lines: string[]): string[] {
  const questions: string[] = [];
  
  for (const line of lines) {
    if (line.endsWith("?") && line.length > 10 && line.length < 150) {
      // Filter out rhetorical questions
      const lowerLine = line.toLowerCase();
      if (!lowerLine.includes("how are you") &&
          !lowerLine.includes("hope you're") &&
          !lowerLine.includes("how's it going")) {
        questions.push(line);
      }
    }
  }

  return questions.slice(0, 2); // Max 2 questions
}

/**
 * Extract deadline hint from text
 */
function extractDeadlineHint(text: string): string | null {
  for (const pattern of DEADLINE_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim().toLowerCase();
    }
  }
  return null;
}

/**
 * Estimate effort for a task
 */
function estimateEffort(title: string): {
  effortMinutes: number;
  effortBucket: "quick" | "medium" | "long";
  category?: string;
} {
  const lowerTitle = title.toLowerCase();

  // Check for long effort keywords
  for (const keyword of LONG_EFFORT_KEYWORDS) {
    if (lowerTitle.includes(keyword)) {
      return { 
        effortMinutes: 30, 
        effortBucket: "long",
        category: keyword === "meeting" || keyword === "call" ? "meeting" : "review"
      };
    }
  }

  // Check for quick effort keywords
  for (const keyword of QUICK_EFFORT_KEYWORDS) {
    if (lowerTitle.includes(keyword)) {
      return { 
        effortMinutes: 5, 
        effortBucket: "quick",
        category: keyword === "reply" || keyword === "respond" ? "follow-up" : "send"
      };
    }
  }

  // Default to medium
  return { effortMinutes: 15, effortBucket: "medium" };
}

/**
 * Truncate text to max length
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3).trim() + "...";
}

/**
 * Capitalize first letter
 */
function capitalizeFirst(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}
