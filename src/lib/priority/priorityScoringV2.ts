/**
 * Priority Scoring V2 - Full 5-Dimensional Scoring
 *
 * Expands v1 to include all scoring dimensions:
 * - Urgency (30%) - Time sensitivity
 * - Importance (25%) - Strategic value, explicit priority
 * - Commitment (25%) - Things user promised, calendar events
 * - Recency (10%) - How recently it became relevant
 * - Effort (10%) - Quick wins boost when time-constrained
 *
 * Status: Phase 1 - v2 Implementation
 */

import { differenceInDays, differenceInHours, parseISO, isPast, isToday } from "date-fns";
import type { PrioritySignal } from "@/types/priority";
import { V2_PRIORITY_CONFIG, getEffortCategory } from "@/types/priority";

/**
 * V2 FULL SCORING
 *
 * Formula: priorityScore = Σ(weight_i * score_i) for all dimensions
 */
export function computePriorityScoreV2(
  urgencyScore: number,
  importanceScore: number,
  commitmentScore: number = 0,
  recencyScore: number = 0.5,
  effortScore: number = 0.5,
  options?: { availableMinutes?: number }
): number {
  const { weights } = V2_PRIORITY_CONFIG;

  // If user has time constraint, boost effort dimension
  const effectiveEffortWeight = options?.availableMinutes
    ? weights.effort * 2 // Double effort weight when time-constrained
    : weights.effort;

  // Normalize weights to sum to 1
  const totalWeight = weights.urgency + weights.importance + weights.commitment +
                      weights.recency + effectiveEffortWeight;

  const score = (
    (weights.urgency / totalWeight) * urgencyScore +
    (weights.importance / totalWeight) * importanceScore +
    (weights.commitment / totalWeight) * commitmentScore +
    (weights.recency / totalWeight) * recencyScore +
    (effectiveEffortWeight / totalWeight) * effortScore
  );

  return Math.max(0, Math.min(1, score));
}

// ============================================================================
// TASK SCORING (expanded from v1)
// ============================================================================

/**
 * Compute urgency score for tasks (same as v1)
 */
export function computeTaskUrgencyScoreV2(scheduledFor: string | null | undefined): number {
  if (!scheduledFor) {
    return 0.2; // No due date = low urgency
  }

  const now = new Date();
  const dueDate = parseISO(scheduledFor);
  const daysUntilDue = differenceInDays(dueDate, now);

  if (daysUntilDue < 0) {
    return Math.min(1.0, 0.9 + Math.abs(daysUntilDue) * 0.02);
  } else if (daysUntilDue === 0 || isToday(dueDate)) {
    return 0.9;
  } else if (daysUntilDue === 1) {
    return 0.7;
  } else if (daysUntilDue <= 3) {
    return 0.5;
  } else if (daysUntilDue <= 7) {
    return 0.3;
  }
  return 0.1;
}

/**
 * Compute importance score for tasks
 * v2: Includes company linkage boost
 */
export function computeTaskImportanceScoreV2(
  priority: "low" | "medium" | "high" | null | undefined,
  hasCompanyLink: boolean = false,
  isTopPriority: boolean = false
): number {
  let baseScore = 0.5;

  if (isTopPriority) {
    return 1.0; // User override
  }

  if (priority === "high") {
    baseScore = 1.0;
  } else if (priority === "medium") {
    baseScore = 0.6;
  } else if (priority === "low") {
    baseScore = 0.3;
  }

  // v2: Company linkage boost
  if (hasCompanyLink) {
    baseScore = Math.min(1.0, baseScore + 0.15);
  }

  return baseScore;
}

/**
 * Compute effort score for tasks (new in v2)
 * Higher score = better fit for available time
 */
export function computeTaskEffortScoreV2(
  effortMinutes: number | null | undefined,
  availableMinutes?: number
): number {
  if (!availableMinutes) {
    return 0.5; // Neutral if no time constraint
  }

  if (!effortMinutes) {
    return 0.3; // Unknown effort = slight penalty
  }

  const fits = effortMinutes <= availableMinutes;
  if (!fits) {
    return 0.1; // Doesn't fit = low score
  }

  // Prefer tasks that fit well (not too small, not too big)
  const efficiency = effortMinutes / availableMinutes;
  if (efficiency >= 0.5 && efficiency <= 1.0) {
    return 1.0; // Perfect fit
  } else if (efficiency >= 0.25) {
    return 0.8; // Good fit
  }
  return 0.6; // Task is much smaller than available time
}

// ============================================================================
// COMPANY SCORING (new in v2)
// ============================================================================

/**
 * Compute urgency score for portfolio companies based on staleness
 */
export function computePortfolioUrgencyScoreV2(lastInteractionAt: string | null | undefined): number {
  if (!lastInteractionAt) {
    return 0.95; // Never contacted = very urgent
  }

  const daysSince = differenceInDays(new Date(), parseISO(lastInteractionAt));

  if (daysSince >= 30) {
    return 0.95; // Critical: 30+ days
  } else if (daysSince >= 21) {
    return 0.8; // Warning: 21-30 days
  } else if (daysSince >= 14) {
    return 0.6; // Needs attention: 14-21 days
  } else if (daysSince >= 7) {
    return 0.3; // Getting stale: 7-14 days
  }
  return 0.1; // Fresh: <7 days
}

/**
 * Compute importance score for portfolio companies
 */
export function computePortfolioImportanceScoreV2(
  status: string,
  openTaskCount: number = 0
): number {
  let baseScore = 0.5;

  // Status-based importance
  if (status === 'active') {
    baseScore = 0.8;
  } else if (status === 'watching') {
    baseScore = 0.5;
  } else if (status === 'exited' || status === 'archived') {
    baseScore = 0.2;
  }

  // Open tasks boost importance
  if (openTaskCount > 0) {
    baseScore = Math.min(1.0, baseScore + 0.1);
  }

  return baseScore;
}

/**
 * Compute urgency score for pipeline companies
 */
export function computePipelineUrgencyScoreV2(
  lastInteractionAt: string | null | undefined,
  closeDate: string | null | undefined,
  hasNextSteps: boolean
): number {
  let urgency = 0.3; // Base urgency

  // Close date proximity
  if (closeDate) {
    const daysUntilClose = differenceInDays(parseISO(closeDate), new Date());
    if (daysUntilClose < 0) {
      urgency = Math.max(urgency, 0.95); // Past close date
    } else if (daysUntilClose <= 7) {
      urgency = Math.max(urgency, 0.85); // Closing soon
    } else if (daysUntilClose <= 14) {
      urgency = Math.max(urgency, 0.7);
    }
  }

  // Staleness
  if (lastInteractionAt) {
    const daysSince = differenceInDays(new Date(), parseISO(lastInteractionAt));
    if (daysSince >= 14) {
      urgency = Math.max(urgency, 0.8);
    } else if (daysSince >= 7) {
      urgency = Math.max(urgency, 0.5);
    }
  } else {
    urgency = Math.max(urgency, 0.7); // Never contacted
  }

  // Has next_steps but stale
  if (hasNextSteps && lastInteractionAt) {
    const daysSince = differenceInDays(new Date(), parseISO(lastInteractionAt));
    if (daysSince >= 7) {
      urgency = Math.max(urgency, 0.75);
    }
  }

  return urgency;
}

/**
 * Compute importance score for pipeline companies
 */
export function computePipelineImportanceScoreV2(
  status: string,
  isTopOfMind: boolean,
  sector?: string | null
): number {
  let baseScore = 0.5;

  // Status-based
  if (status === 'active' || status === 'interesting') {
    baseScore = 0.8;
  } else if (status === 'new' || status === 'to_share') {
    baseScore = 0.6;
  } else if (status === 'passed') {
    return 0.1; // Very low importance
  }

  // Top of mind flag
  if (isTopOfMind) {
    baseScore = Math.min(1.0, baseScore + 0.2);
  }

  return baseScore;
}

// ============================================================================
// READING LIST SCORING (new in v2)
// ============================================================================

/**
 * Compute urgency score for reading items based on age
 */
export function computeReadingUrgencyScoreV2(createdAt: string): number {
  const daysOld = differenceInDays(new Date(), parseISO(createdAt));

  if (daysOld >= 30) {
    return 0.1; // Very old = low urgency (maybe should delete)
  } else if (daysOld >= 14) {
    return 0.3;
  } else if (daysOld >= 7) {
    return 0.5;
  } else if (daysOld >= 1) {
    return 0.7;
  }
  return 0.9; // Added today = high urgency
}

/**
 * Compute importance score for reading items
 */
export function computeReadingImportanceScoreV2(
  isRead: boolean,
  hasProject: boolean
): number {
  let baseScore = 0.4; // Base importance for reading items

  if (!isRead) {
    baseScore = 0.6; // Unread = more important
  }

  if (hasProject) {
    baseScore = Math.min(1.0, baseScore + 0.15); // Project-linked = more important
  }

  return baseScore;
}

// ============================================================================
// NONNEGOTIABLE SCORING (new in v2)
// ============================================================================

/**
 * Compute urgency score for nonnegotiables
 * Based on whether it's time to do the habit
 */
export function computeNonnegotiableUrgencyScoreV2(
  reminderTime: string | null | undefined,
  frequency: string | null | undefined
): number {
  // If has reminder time, check proximity
  if (reminderTime) {
    const [hours, minutes] = reminderTime.split(':').map(Number);
    const now = new Date();
    const reminderToday = new Date();
    reminderToday.setHours(hours, minutes, 0, 0);

    const hoursUntil = differenceInHours(reminderToday, now);

    if (hoursUntil < 0 && hoursUntil > -4) {
      return 0.9; // Past due today
    } else if (hoursUntil >= 0 && hoursUntil < 2) {
      return 0.8; // Coming up soon
    } else if (hoursUntil >= 0 && hoursUntil < 6) {
      return 0.5;
    }
  }

  // Default based on frequency
  if (frequency === 'daily') {
    return 0.6;
  }
  return 0.4;
}

/**
 * Compute importance score for nonnegotiables
 */
export function computeNonnegotiableImportanceScoreV2(
  isActive: boolean
): number {
  return isActive ? 0.75 : 0.3;
}

// ============================================================================
// COMMITMENT SCORING (new in Phase 2)
// ============================================================================

/**
 * Compute urgency score for commitments based on due date and implied urgency
 */
export function computeCommitmentUrgencyScoreV2(
  dueAt: string | null | undefined,
  impliedUrgency: string | null | undefined,
  snoozeCount: number = 0
): number {
  let urgency = 0.5; // Base urgency for commitments

  // Due date takes priority
  if (dueAt) {
    const now = new Date();
    const dueDate = parseISO(dueAt);
    const daysUntilDue = differenceInDays(dueDate, now);

    if (daysUntilDue < 0) {
      // Overdue - escalate based on how overdue
      urgency = Math.min(1.0, 0.95 + Math.abs(daysUntilDue) * 0.01);
    } else if (daysUntilDue === 0 || isToday(dueDate)) {
      urgency = 0.95;
    } else if (daysUntilDue === 1) {
      urgency = 0.85;
    } else if (daysUntilDue <= 3) {
      urgency = 0.7;
    } else if (daysUntilDue <= 7) {
      urgency = 0.5;
    } else {
      urgency = 0.3;
    }
  } else if (impliedUrgency) {
    // Use implied urgency if no explicit due date
    switch (impliedUrgency) {
      case 'asap':
        urgency = 0.95;
        break;
      case 'today':
        urgency = 0.9;
        break;
      case 'this_week':
        urgency = 0.7;
        break;
      case 'next_week':
        urgency = 0.5;
        break;
      case 'this_month':
        urgency = 0.3;
        break;
      case 'when_possible':
        urgency = 0.2;
        break;
    }
  }

  // Snooze penalty - repeatedly snoozed commitments escalate
  if (snoozeCount > 0) {
    urgency = Math.min(1.0, urgency + snoozeCount * 0.05);
  }

  return urgency;
}

/**
 * Compute importance score for commitments
 * Based on who the commitment is to (VIP, company link)
 */
export function computeCommitmentImportanceScoreV2(
  personName: string | null | undefined,
  companyType: 'portfolio' | 'pipeline' | null | undefined,
  isVip: boolean = false
): number {
  let baseScore = 0.7; // Commitments are inherently important

  // VIP boost
  if (isVip) {
    baseScore = Math.min(1.0, baseScore + 0.2);
  }

  // Company type boost
  if (companyType === 'portfolio') {
    baseScore = Math.min(1.0, baseScore + 0.15);
  } else if (companyType === 'pipeline') {
    baseScore = Math.min(1.0, baseScore + 0.1);
  }

  return baseScore;
}

/**
 * Compute commitment score for commitments (this IS the commitment itself)
 */
export function computeCommitmentCommitmentScoreV2(
  hasPersonLink: boolean,
  companyType: 'portfolio' | 'pipeline' | null | undefined
): number {
  // All commitments have high commitment score by definition
  let score = 0.85;

  if (hasPersonLink) {
    score = 0.95; // Promise to a specific person is higher commitment
  }

  if (companyType === 'portfolio') {
    score = Math.min(1.0, score + 0.05); // Portfolio company = highest stakes
  }

  return score;
}

// ============================================================================
// CALENDAR SCORING (enhanced from v1)
// ============================================================================

export function computeCalendarUrgencyScoreV2(eventStartAt: string): number {
  const hoursUntil = differenceInHours(parseISO(eventStartAt), new Date());

  if (hoursUntil < 0) {
    return 0.0; // Past
  } else if (hoursUntil < 0.5) {
    return 1.0; // Starting in 30 minutes
  } else if (hoursUntil < 1) {
    return 0.98; // Starting in an hour
  } else if (hoursUntil < 2) {
    return 0.9;
  } else if (hoursUntil < 4) {
    return 0.75;
  } else if (hoursUntil < 12) {
    return 0.5;
  } else if (hoursUntil < 24) {
    return 0.4;
  }
  return 0.2;
}

export function computeCalendarCommitmentScoreV2(
  hasAttendees: boolean,
  attendeeCount: number = 0
): number {
  // Calendar events are inherently commitments
  let score = 0.8;

  if (hasAttendees) {
    // More attendees = higher commitment
    if (attendeeCount >= 5) {
      score = 1.0;
    } else if (attendeeCount >= 2) {
      score = 0.9;
    }
  }

  return score;
}

// ============================================================================
// INBOX SCORING (same as v1)
// ============================================================================

export function computeInboxUrgencyScoreV2(receivedAt: string): number {
  const hoursOld = differenceInHours(new Date(), parseISO(receivedAt));

  if (hoursOld < 4) {
    return 1.0;
  } else if (hoursOld < 24) {
    return 0.8;
  } else if (hoursOld < 48) {
    return 0.6;
  } else if (hoursOld < 72) {
    return 0.4;
  }
  return 0.2;
}

export function computeInboxImportanceScoreV2(
  isRead: boolean,
  hasCompanyLink: boolean = false
): number {
  let score = isRead ? 0.7 : 0.9;

  if (hasCompanyLink) {
    score = Math.min(1.0, score + 0.1);
  }

  return score;
}

// ============================================================================
// RECENCY SCORING (shared)
// ============================================================================

export function computeRecencyScoreV2(timestamp: string | undefined): number {
  if (!timestamp) {
    return 0.5;
  }

  const daysSince = differenceInDays(new Date(), parseISO(timestamp));

  if (daysSince === 0) {
    return 1.0;
  } else if (daysSince <= 1) {
    return 0.8;
  } else if (daysSince <= 3) {
    return 0.5;
  } else if (daysSince <= 7) {
    return 0.3;
  }
  return 0.1;
}

// ============================================================================
// SIGNAL GENERATION
// ============================================================================

export function generateSignalsV2(
  scores: {
    urgency: number;
    importance: number;
    commitment: number;
    recency: number;
    effort?: number;
  },
  context: {
    urgencyDescription: string;
    importanceDescription: string;
    commitmentDescription?: string;
    recencyDescription?: string;
    effortDescription?: string;
  }
): PrioritySignal[] {
  const signals: PrioritySignal[] = [];

  signals.push({
    source: "urgency",
    weight: scores.urgency,
    description: context.urgencyDescription,
  });

  signals.push({
    source: "importance",
    weight: scores.importance,
    description: context.importanceDescription,
  });

  if (scores.commitment > 0) {
    signals.push({
      source: "commitment",
      weight: scores.commitment,
      description: context.commitmentDescription || "Commitment factor",
    });
  }

  signals.push({
    source: "recency",
    weight: scores.recency,
    description: context.recencyDescription || "Recency factor",
  });

  if (scores.effort !== undefined) {
    signals.push({
      source: "effort",
      weight: scores.effort,
      description: context.effortDescription || "Effort consideration",
    });
  }

  return signals;
}
