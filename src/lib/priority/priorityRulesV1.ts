/**
 * Priority Rules V1 - Simplified Filtering and Selection
 *
 * This file contains the v1 filtering logic focusing on:
 * - Simple exclusion rules (completed, resolved, past events, snoozed)
 * - Two always-include rules (calendar <2h, overdue high-priority tasks)
 * - Simple top-8 selection (NO diversity rules, NO score thresholds)
 *
 * Status: Phase 1 - v1 Implementation
 * See docs/priority_system/03_v1_tuning_guide.md for tuning instructions
 *
 * NOT USED in v1:
 * - Source diversity rules (max N per source) - deferred to v2
 * - Score thresholds (min score filter) - deferred to v2
 */

import { parseISO, differenceInHours, isPast, isToday } from "date-fns";
import type { PriorityItem, PrioritySourceType } from "@/types/priority";

/**
 * V1 EXCLUSION RULES
 *
 * Exclude items that should never appear:
 * 1. Completed tasks
 * 2. Resolved inbox items
 * 3. Calendar events in the past (>1 hour ago)
 * 4. Snoozed items (before snoozedUntil)
 *
 * NO complexity beyond this for v1.
 */
export function shouldExcludeV1(item: any, sourceType: PrioritySourceType): boolean {
  const now = new Date();

  // 1. Completed tasks
  if (sourceType === "task" && item.completed) {
    return true;
  }

  // 2. Resolved inbox
  if (sourceType === "inbox" && (item.is_resolved || item.isResolved)) {
    return true;
  }

  // 3. Past calendar events (>1 hour ago)
  if (sourceType === "calendar_event" && item.start_time) {
    const hoursSinceStart = differenceInHours(now, parseISO(item.start_time));
    if (hoursSinceStart > 1) {
      return true;
    }
  }

  // 4. Snoozed items
  if (item.snoozed_until && parseISO(item.snoozed_until) > now) {
    return true;
  }
  if (item.snoozedUntil && parseISO(item.snoozedUntil) > now) {
    return true;
  }

  return false;
}

/**
 * V1 ALWAYS-INCLUDE RULES
 *
 * Only TWO rules for v1:
 * 1. Calendar events starting in < 2 hours
 * 2. Overdue high-priority tasks
 */
export function isAlwaysIncludeV1(item: PriorityItem): boolean {
  const now = new Date();

  // 1. Calendar events starting soon
  if (item.sourceType === "calendar_event" && item.eventStartAt) {
    const hoursUntil = differenceInHours(parseISO(item.eventStartAt), now);
    if (hoursUntil >= 0 && hoursUntil < 2) {
      return true;
    }
  }

  // 2. Overdue high-priority tasks
  if (item.sourceType === "task" && item.dueAt) {
    const dueDate = parseISO(item.dueAt);
    const isOverdue = isPast(dueDate) && !isToday(dueDate);
    if (isOverdue && item.importanceScore >= 0.9) { // High priority = 1.0, but allow small margin
      return true;
    }
  }

  return false;
}

/**
 * V1 SELECTION LOGIC
 *
 * Simple: Sort by priorityScore, take top 8 items
 *
 * NO DIVERSITY RULES in v1 (e.g., max N per source)
 * NO SCORE THRESHOLD in v1 (all items eligible)
 */
export function selectTopPriorityItemsV1(items: PriorityItem[]): PriorityItem[] {
  // Separate always-include items
  const alwaysIncluded = items.filter(isAlwaysIncludeV1);
  const remaining = items.filter(item => !isAlwaysIncludeV1(item));

  // Sort remaining by priorityScore descending
  remaining.sort((a, b) => b.priorityScore - a.priorityScore);

  // Combine and limit to 8 items
  const selected = [...alwaysIncluded, ...remaining].slice(0, 8);

  // Final sort by priorityScore (ensures always-include items are still ordered correctly)
  selected.sort((a, b) => b.priorityScore - a.priorityScore);

  return selected;
}

/**
 * Helper: Get source type distribution of items
 *
 * Returns a map of source type to count, useful for debugging and analytics
 */
export function getSourceTypeDistribution(items: PriorityItem[]): Map<PrioritySourceType, number> {
  const distribution = new Map<PrioritySourceType, number>();

  for (const item of items) {
    const count = distribution.get(item.sourceType) || 0;
    distribution.set(item.sourceType, count + 1);
  }

  return distribution;
}

/**
 * Helper: Get average priority score
 */
export function getAvgScore(items: PriorityItem[]): number {
  if (items.length === 0) return 0;
  const sum = items.reduce((acc, item) => acc + item.priorityScore, 0);
  return sum / items.length;
}

/**
 * Helper: Get min priority score
 */
export function getMinScore(items: PriorityItem[]): number {
  if (items.length === 0) return 0;
  return Math.min(...items.map(item => item.priorityScore));
}

/**
 * Helper: Get max priority score
 */
export function getMaxScore(items: PriorityItem[]): number {
  if (items.length === 0) return 0;
  return Math.max(...items.map(item => item.priorityScore));
}

/**
 * Helper: Validate priority item meets minimum requirements
 *
 * Ensures all required fields are present and scores are valid (0-1 range)
 */
export function validatePriorityItem(item: PriorityItem): boolean {
  // Check required fields
  if (!item.id || !item.sourceType || !item.sourceId || !item.title) {
    return false;
  }

  // Check score ranges (0-1)
  const scores = [
    item.urgencyScore,
    item.importanceScore,
    item.priorityScore,
  ];

  for (const score of scores) {
    if (score < 0 || score > 1 || isNaN(score)) {
      return false;
    }
  }

  return true;
}
