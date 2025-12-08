/**
 * Priority Scoring - Multi-dimensional Scoring Functions
 *
 * This file contains the core scoring algorithm for the unified priority system.
 * Implements multi-dimensional scoring (urgency, importance, recency, commitment)
 * and computes final priority score using configurable weights.
 *
 * Status: Phase 1 - Stubbed/unimplemented
 * See docs/priority_system/02_proposed_model.md for scoring specifications
 *
 * TODO: Implement in Phase 2
 * - Complete scoring functions for each dimension
 * - Implement weighted score computation
 * - Add unit tests for scoring edge cases
 */

import { differenceInDays, differenceInHours, parseISO } from "date-fns";
import type { PriorityItem, PriorityConfig, PrioritySignal } from "@/types/priority";
import { DEFAULT_PRIORITY_CONFIG } from "@/types/priority";

/**
 * Compute final priority score from multi-dimensional scores
 *
 * Formula:
 * priorityScore = w_urgency * urgencyScore +
 *                 w_importance * importanceScore +
 *                 w_recency * recencyScore +
 *                 w_commitment * commitmentScore +
 *                 w_effort * (1 - effortScore) // Inverse: quick wins get boost
 *
 * See docs/priority_system/02_proposed_model.md section "Scoring Function & Weights"
 */
export function computePriorityScore(
  scores: {
    urgencyScore: number;
    importanceScore: number;
    recencyScore: number;
    commitmentScore: number;
    effortScore?: number;
  },
  config: PriorityConfig = DEFAULT_PRIORITY_CONFIG
): number {
  const { weights } = config;

  let score =
    weights.urgency * scores.urgencyScore +
    weights.importance * scores.importanceScore +
    weights.recency * scores.recencyScore +
    weights.commitment * scores.commitmentScore;

  // Optional: Adjust for effort (quick wins get slight boost)
  if (scores.effortScore !== undefined && weights.effort > 0) {
    // Inverse effort: lower effort = higher score
    score += weights.effort * (1 - scores.effortScore);
  }

  // Ensure score is between 0 and 1
  return Math.max(0, Math.min(1, score));
}

/**
 * Compute urgency score for a task based on deadline proximity
 *
 * Logic:
 * - Overdue: 0.9 + (days overdue * 0.02), capped at 1.0
 * - Due today: 0.9
 * - Due tomorrow: 0.7
 * - Due within 3 days: 0.5
 * - Due within a week: 0.3
 * - More than a week: 0.1
 * - No deadline: 0.2 (default low urgency)
 *
 * See docs/priority_system/02_proposed_model.md section "Tasks → PriorityItem"
 */
export function computeTaskUrgencyScore(scheduledFor: string | null): number {
  // TODO: Implement full logic
  // This is a skeleton implementation
  if (!scheduledFor) {
    return 0.2; // No due date = low urgency
  }

  const now = new Date();
  const dueDate = parseISO(scheduledFor);
  const daysUntilDue = differenceInDays(dueDate, now);

  // Placeholder logic
  if (daysUntilDue < 0) {
    // Overdue
    return Math.min(1.0, 0.9 + Math.abs(daysUntilDue) * 0.02);
  } else if (daysUntilDue === 0) {
    return 0.9;
  } else if (daysUntilDue <= 1) {
    return 0.7;
  } else if (daysUntilDue <= 3) {
    return 0.5;
  } else if (daysUntilDue <= 7) {
    return 0.3;
  } else {
    return 0.1;
  }
}

/**
 * Compute importance score for a task based on explicit priority and context
 *
 * Logic:
 * - High priority: 0.9
 * - Medium priority: 0.6
 * - Low priority: 0.3
 * - No priority: 0.3 (default)
 * - Boost by 0.2 if linked to company (capped at 1.0)
 *
 * See docs/priority_system/02_proposed_model.md section "Tasks → PriorityItem"
 */
export function computeTaskImportanceScore(
  priority: "low" | "medium" | "high" | null | undefined,
  hasCompanyLink: boolean
): number {
  // TODO: Implement full logic
  let score = 0.3; // Default

  if (priority === "high") {
    score = 0.9;
  } else if (priority === "medium") {
    score = 0.6;
  } else if (priority === "low") {
    score = 0.3;
  }

  // Boost if linked to company
  if (hasCompanyLink) {
    score += 0.2;
  }

  return Math.min(1.0, score);
}

/**
 * Compute recency score based on last update timestamp
 *
 * Logic:
 * - Updated today: 1.0
 * - Updated yesterday: 0.8
 * - Updated in last 3 days: 0.5
 * - Updated in last week: 0.3
 * - Older: 0.1 (stale)
 *
 * See docs/priority_system/02_proposed_model.md section "Tasks → PriorityItem"
 */
export function computeRecencyScore(updatedAt: string): number {
  // TODO: Implement full logic
  const now = new Date();
  const lastUpdate = parseISO(updatedAt);
  const daysSinceUpdate = differenceInDays(now, lastUpdate);

  if (daysSinceUpdate === 0) {
    return 1.0;
  } else if (daysSinceUpdate <= 1) {
    return 0.8;
  } else if (daysSinceUpdate <= 3) {
    return 0.5;
  } else if (daysSinceUpdate <= 7) {
    return 0.3;
  } else {
    return 0.1;
  }
}

/**
 * Compute urgency score for inbox items based on email age
 *
 * Logic:
 * - <4 hours old: 1.0 (very recent)
 * - <24 hours old: 0.8 (same day)
 * - 1-2 days old: 0.6
 * - 2-3 days old: 0.4
 * - Older: 0.2
 *
 * See docs/priority_system/02_proposed_model.md section "Inbox Items → PriorityItem"
 */
export function computeInboxUrgencyScore(receivedAt: string): number {
  // TODO: Implement full logic
  const now = new Date();
  const received = parseISO(receivedAt);
  const hoursOld = differenceInHours(now, received);

  if (hoursOld < 4) {
    return 1.0;
  } else if (hoursOld < 24) {
    return 0.8;
  } else if (hoursOld < 48) {
    return 0.6;
  } else if (hoursOld < 72) {
    return 0.4;
  } else {
    return 0.2;
  }
}

/**
 * Compute urgency score for companies based on interaction staleness
 *
 * Logic:
 * - No interaction ever: 0.9
 * - >60 days: 0.8 (very stale)
 * - >30 days: 0.6 (stale)
 * - >14 days: 0.4 (getting stale)
 * - Recent: 0.2
 *
 * See docs/priority_system/02_proposed_model.md section "Portfolio Companies → PriorityItem"
 */
export function computeCompanyStalenessScore(
  lastInteractionAt: string | null,
  config: PriorityConfig = DEFAULT_PRIORITY_CONFIG
): number {
  // TODO: Implement full logic
  if (!lastInteractionAt) {
    return 0.9; // No interaction ever
  }

  const now = new Date();
  const lastInteraction = parseISO(lastInteractionAt);
  const daysSince = differenceInDays(now, lastInteraction);

  if (daysSince > 60) {
    return 0.8;
  } else if (daysSince > 30) {
    return 0.6;
  } else if (daysSince > config.companyStaleThreshold) {
    return 0.4;
  } else {
    return 0.2;
  }
}

/**
 * Compute urgency score for calendar events based on proximity to start time
 *
 * Logic:
 * - Already started (<0 hours): 0.5 (maybe prep for post-meeting follow-up)
 * - <1 hour: 1.0 (starting very soon)
 * - <4 hours: 0.9 (starting soon)
 * - <24 hours: 0.7 (today)
 * - <48 hours: 0.5 (tomorrow)
 * - 2+ days: 0.3
 *
 * See docs/priority_system/02_proposed_model.md section "Calendar Events → PriorityItem"
 */
export function computeCalendarUrgencyScore(eventStartAt: string): number {
  // TODO: Implement full logic
  const now = new Date();
  const start = parseISO(eventStartAt);
  const hoursUntil = differenceInHours(start, now);

  if (hoursUntil < 0) {
    return 0.5; // Already started
  } else if (hoursUntil < 1) {
    return 1.0;
  } else if (hoursUntil < 4) {
    return 0.9;
  } else if (hoursUntil < 24) {
    return 0.7;
  } else if (hoursUntil < 48) {
    return 0.5;
  } else {
    return 0.3;
  }
}

/**
 * Generate reasoning string explaining why an item is prioritized
 *
 * This creates a human-readable explanation based on the item's scores and context.
 * Used for explainability in the UI.
 *
 * See docs/priority_system/02_proposed_model.md section "Explainability"
 */
export function generateReasoning(item: Partial<PriorityItem>): string {
  // TODO: Implement full logic
  // This is a placeholder
  const parts: string[] = [];

  if (item.isOverdue) {
    parts.push("Overdue");
  } else if (item.isDueToday) {
    parts.push("Due today");
  } else if (item.isDueSoon) {
    parts.push("Due soon");
  }

  if (item.importanceScore && item.importanceScore > 0.8) {
    parts.push("High priority");
  }

  if (item.companyName) {
    parts.push(`Linked to ${item.companyName}`);
  }

  return parts.length > 0 ? parts.join(". ") + "." : "Needs attention.";
}

/**
 * Generate priority signals explaining score contributors
 *
 * This creates a breakdown of the individual factors contributing to the priority score.
 * Used for debugging and transparency.
 *
 * See docs/priority_system/02_proposed_model.md section "Explainability"
 */
export function generateSignals(
  scores: {
    urgencyScore: number;
    importanceScore: number;
    recencyScore: number;
    commitmentScore: number;
  },
  context: {
    sourceType: string;
    daysOverdue?: number;
    priority?: string;
    companyName?: string;
    daysSinceUpdate?: number;
  }
): PrioritySignal[] {
  // TODO: Implement full logic
  // This is a placeholder
  const signals: PrioritySignal[] = [];

  signals.push({
    source: "urgency",
    weight: scores.urgencyScore,
    description: `Urgency score based on ${context.sourceType}`,
  });

  signals.push({
    source: "importance",
    weight: scores.importanceScore,
    description: context.priority ? `${context.priority} priority` : "Default importance",
  });

  signals.push({
    source: "recency",
    weight: scores.recencyScore,
    description: `Last updated ${context.daysSinceUpdate || 0} days ago`,
  });

  signals.push({
    source: "commitment",
    weight: scores.commitmentScore,
    description: "Commitment level",
  });

  return signals;
}
