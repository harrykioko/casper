/**
 * Priority Scoring V1 - Simplified 2-Dimensional Scoring
 *
 * This file contains the v1 scoring implementation focusing on:
 * - Urgency (60%) - Time sensitivity
 * - Importance (40%) - Explicit priority and flags
 *
 * Status: Phase 1 - v1 Implementation
 * See docs/priority_system/03_v1_tuning_guide.md for tuning instructions
 *
 * NOT USED in v1:
 * - Recency scoring (computed for debugging only)
 * - Commitment scoring (deferred to v2)
 * - Effort scoring (deferred to v2)
 */

import { differenceInDays, differenceInHours, parseISO, isPast, isToday, startOfDay } from "date-fns";
import type { PrioritySignal } from "@/types/priority";
import { V1_PRIORITY_CONFIG } from "@/types/priority";

/**
 * V1 SIMPLIFIED SCORING
 *
 * Formula: priorityScore = 0.6 * urgencyScore + 0.4 * importanceScore
 *
 * Weights:
 * - Urgency: 60% (time pressure is primary driver)
 * - Importance: 40% (explicit priority matters)
 *
 * NOT USED in v1:
 * - Recency (compute for debugging but don't weight)
 * - Commitment (deferred to v2)
 * - Effort (deferred to v2)
 */
export function computePriorityScoreV1(
  urgencyScore: number,
  importanceScore: number
): number {
  const score = V1_PRIORITY_CONFIG.weights.urgency * urgencyScore +
                V1_PRIORITY_CONFIG.weights.importance * importanceScore;

  return Math.max(0, Math.min(1, score)); // Clamp to [0, 1]
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
 */
export function computeTaskUrgencyScore(scheduledFor: string | null | undefined): number {
  if (!scheduledFor) {
    return 0.2; // No due date = low urgency
  }

  const now = new Date();
  const dueDate = parseISO(scheduledFor);
  const daysUntilDue = differenceInDays(dueDate, now);

  if (daysUntilDue < 0) {
    // Overdue: max urgency, scaling with age
    return Math.min(1.0, 0.9 + Math.abs(daysUntilDue) * 0.02);
  } else if (daysUntilDue === 0 || isToday(dueDate)) {
    return 0.9; // Due today
  } else if (daysUntilDue === 1) {
    return 0.7; // Due tomorrow
  } else if (daysUntilDue <= 3) {
    return 0.5; // Due within 3 days
  } else if (daysUntilDue <= 7) {
    return 0.3; // Due within a week
  } else {
    return 0.1; // More than a week away
  }
}

/**
 * Compute importance score for a task based on explicit priority
 *
 * Logic (v1 simplified - NO company linkage boost):
 * - High priority: 1.0
 * - Medium priority: 0.6
 * - Low priority: 0.3
 * - No priority: 0.5 (default medium)
 */
export function computeTaskImportanceScore(
  priority: "low" | "medium" | "high" | null | undefined
): number {
  if (priority === "high") {
    return 1.0;
  } else if (priority === "medium") {
    return 0.6;
  } else if (priority === "low") {
    return 0.3;
  }

  // No priority specified = default medium
  return 0.5;
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
 */
export function computeInboxUrgencyScore(receivedAt: string): number {
  const now = new Date();
  const received = parseISO(receivedAt);
  const hoursOld = differenceInHours(now, received);

  if (hoursOld < V1_PRIORITY_CONFIG.inboxUrgentWindow) { // Default 4 hours
    return 1.0; // Very recent
  } else if (hoursOld < 24) {
    return 0.8; // Same day
  } else if (hoursOld < 48) {
    return 0.6; // 1-2 days old
  } else if (hoursOld < 72) {
    return 0.4; // 2-3 days old
  } else {
    return 0.2; // Older than 3 days
  }
}

/**
 * Compute importance score for inbox items
 *
 * Logic (v1 simplified):
 * - Unread: 0.9 (more important)
 * - Read: 0.7 (base importance for all inbox items)
 * - NO company linkage boost in v1
 */
export function computeInboxImportanceScore(isRead: boolean): number {
  if (!isRead) {
    return 0.9; // Unread = more important
  }
  return 0.7; // Base importance for all inbox items
}

/**
 * Compute urgency score for calendar events based on proximity to start time
 *
 * Logic:
 * - Already started (<0 hours): 0.0 (will be filtered out)
 * - <1 hour: 1.0 (starting very soon)
 * - 1-2 hours: 0.95 (starting soon)
 * - 2-4 hours: 0.8 (starting in next few hours)
 * - <24 hours: 0.6 (today)
 * - <48 hours: 0.4 (tomorrow)
 * - 2+ days: 0.2
 */
export function computeCalendarUrgencyScore(eventStartAt: string): number {
  const now = new Date();
  const start = parseISO(eventStartAt);
  const hoursUntil = differenceInHours(start, now);

  if (hoursUntil < 0) {
    return 0.0; // Already started (will be excluded by filter)
  } else if (hoursUntil < 1) {
    return 1.0; // Starting within the hour
  } else if (hoursUntil < 2) {
    return 0.95; // Starting in 1-2 hours
  } else if (hoursUntil < 4) {
    return 0.8; // Starting in next few hours
  } else if (hoursUntil < 24) {
    return 0.6; // Today
  } else if (hoursUntil < 48) {
    return 0.4; // Tomorrow
  } else {
    return 0.2; // 2+ days away
  }
}

/**
 * Compute importance score for calendar events
 *
 * Logic (v1 simplified):
 * - Fixed importance for all calendar events: 0.8
 * - NO attendee count detection in v1
 * - NO event type detection in v1
 */
export function computeCalendarImportanceScore(): number {
  return 0.8; // Calendar events are inherently important
}

/**
 * Compute urgency score for a commitment based on direction and date proximity
 *
 * - owed_by_me: uses dueAt proximity (reuses task urgency scoring)
 * - owed_to_me: uses expectedBy proximity
 * - Multiplied by urgency factor: high=1.2, medium=1.0, low=0.8
 */
export function computeCommitmentUrgencyScore(
  direction: string | null | undefined,
  dueAt: string | null | undefined,
  expectedBy: string | null | undefined,
  impliedUrgency: string | null | undefined
): number {
  const dateToUse = direction === 'owed_to_me' ? expectedBy : dueAt;
  const baseUrgency = computeTaskUrgencyScore(dateToUse);

  // Apply urgency multiplier
  let urgencyFactor = 1.0;
  if (impliedUrgency === 'asap' || impliedUrgency === 'today') {
    urgencyFactor = 1.2;
  } else if (impliedUrgency === 'when_possible') {
    urgencyFactor = 0.8;
  }

  return Math.min(1.0, baseUrgency * urgencyFactor);
}

/**
 * Compute importance score for a commitment based on direction and VIP status
 *
 * Base scores:
 * - owed_by_me: 0.7 (my promises are high importance)
 * - owed_to_me: 0.5 (tracking what others owe)
 * - waiting_on: 0.6 (need follow-up)
 *
 * Boosts:
 * - VIP person: +0.15
 * - High urgency: +0.1
 * - Low urgency: -0.05
 */
export function computeCommitmentImportanceScore(
  direction: string | null | undefined,
  isVip: boolean = false,
  impliedUrgency: string | null | undefined
): number {
  let base = 0.6; // default

  if (direction === 'owed_by_me') {
    base = 0.7;
  } else if (direction === 'owed_to_me') {
    base = 0.5;
  }

  if (isVip) base += 0.15;

  if (impliedUrgency === 'asap' || impliedUrgency === 'today') {
    base += 0.1;
  } else if (impliedUrgency === 'when_possible') {
    base -= 0.05;
  }

  return Math.max(0, Math.min(1, base));
}

/**
 * Generate reasoning string for commitment items
 */
export function generateCommitmentReasoning(
  direction: string | null | undefined,
  dueAt: string | null | undefined,
  expectedBy: string | null | undefined,
  personName: string | null | undefined
): string {
  const parts: string[] = [];

  if (direction === 'owed_by_me') {
    parts.push("You owe this");
  } else if (direction === 'owed_to_me') {
    parts.push("Owed to you");
  }

  const dateToCheck = direction === 'owed_to_me' ? expectedBy : dueAt;
  if (dateToCheck) {
    const daysUntil = differenceInDays(parseISO(dateToCheck), new Date());
    if (daysUntil < 0) {
      parts.push(`Overdue by ${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? '' : 's'}`);
    } else if (daysUntil === 0 || isToday(parseISO(dateToCheck))) {
      parts.push("Due today");
    } else if (daysUntil <= 3) {
      parts.push(`Due in ${daysUntil} days`);
    }
  }

  if (personName) {
    parts.push(`With ${personName}`);
  }

  return parts.length > 0 ? parts.join(". ") + "." : "Commitment needs attention.";
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
 * NOTE: This is computed for DEBUGGING ONLY in v1.
 * It does NOT affect the priority score.
 */
export function computeRecencyScore(updatedAt: string | undefined): number {
  if (!updatedAt) {
    return 0.5; // Default if no timestamp
  }

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
 * Generate reasoning string explaining why an item is prioritized
 *
 * This creates a human-readable explanation based on the item's context.
 * Used for explainability in the UI.
 */
export function generateTaskReasoning(
  scheduledFor: string | null | undefined,
  priority: string | null | undefined,
  companyName?: string | null
): string {
  const parts: string[] = [];

  if (scheduledFor) {
    const now = new Date();
    const dueDate = parseISO(scheduledFor);
    const daysUntilDue = differenceInDays(dueDate, now);

    if (daysUntilDue < 0) {
      parts.push(`Overdue by ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) === 1 ? '' : 's'}`);
    } else if (isToday(dueDate)) {
      parts.push("Due today");
    } else if (daysUntilDue === 1) {
      parts.push("Due tomorrow");
    } else if (daysUntilDue <= 7) {
      parts.push(`Due in ${daysUntilDue} days`);
    }
  }

  if (priority === "high") {
    parts.push("High priority");
  } else if (priority === "medium") {
    parts.push("Medium priority");
  } else if (priority === "low") {
    parts.push("Low priority");
  }

  if (companyName) {
    parts.push(`Linked to ${companyName}`);
  }

  return parts.length > 0 ? parts.join(". ") + "." : "Task needs attention.";
}

/**
 * Generate reasoning string for inbox items
 */
export function generateInboxReasoning(
  receivedAt: string,
  isRead: boolean
): string {
  const parts: string[] = [];
  const hoursOld = differenceInHours(new Date(), parseISO(receivedAt));
  const daysOld = Math.floor(hoursOld / 24);

  if (daysOld === 0) {
    parts.push("Received today");
  } else if (daysOld === 1) {
    parts.push("Received yesterday");
  } else {
    parts.push(`Received ${daysOld} days ago`);
  }

  if (!isRead) {
    parts.push("Unread");
  }

  parts.push("Needs response or resolution");

  return parts.join(". ") + ".";
}

/**
 * Generate reasoning string for calendar events
 */
export function generateCalendarReasoning(eventStartAt: string): string {
  const hoursUntil = differenceInHours(parseISO(eventStartAt), new Date());
  const minutesUntil = Math.round(hoursUntil * 60);

  if (minutesUntil < 60) {
    return `Starts in ${minutesUntil} minute${minutesUntil === 1 ? '' : 's'}. Calendar event.`;
  } else if (hoursUntil < 24) {
    const hours = Math.floor(hoursUntil);
    return `Starts in ${hours} hour${hours === 1 ? '' : 's'}. Calendar event.`;
  } else {
    const days = Math.floor(hoursUntil / 24);
    return `Starts in ${days} day${days === 1 ? '' : 's'}. Calendar event.`;
  }
}

/**
 * Generate priority signals explaining score contributors
 *
 * This creates a breakdown of the individual factors contributing to the priority score.
 * Used for debugging and transparency.
 */
export function generateSignals(
  urgencyScore: number,
  importanceScore: number,
  recencyScore: number | undefined,
  sourceType: string,
  context: {
    urgencyDescription: string;
    importanceDescription: string;
  }
): PrioritySignal[] {
  const signals: PrioritySignal[] = [];

  signals.push({
    source: "urgency",
    weight: urgencyScore,
    description: context.urgencyDescription,
  });

  signals.push({
    source: "importance",
    weight: importanceScore,
    description: context.importanceDescription,
  });

  // Include recency signal for debugging (but marked as not used in v1)
  if (recencyScore !== undefined) {
    signals.push({
      source: "recency_debug",
      weight: recencyScore,
      description: "Not used in v1 scoring (debug only)",
    });
  }

  return signals;
}
