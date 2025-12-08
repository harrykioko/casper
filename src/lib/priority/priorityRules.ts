/**
 * Priority Rules - Filtering and Selection Logic
 *
 * This file contains the rules engine for filtering, sorting, and selecting
 * priority items to display. Implements exclusion rules, inclusion rules,
 * diversity constraints, and score thresholds.
 *
 * Status: Phase 1 - Stubbed/unimplemented
 * See docs/priority_system/02_proposed_model.md for rules specifications
 *
 * TODO: Implement in Phase 2
 * - Complete filtering functions
 * - Implement selection algorithm with diversity
 * - Add unit tests for edge cases
 */

import { parseISO, differenceInHours } from "date-fns";
import type { PriorityItem, PriorityConfig, PrioritySourceType } from "@/types/priority";
import { DEFAULT_PRIORITY_CONFIG } from "@/types/priority";

/**
 * Pre-Score Filters: Exclude items that should never appear in priority list
 *
 * Exclusion criteria:
 * 1. Snoozed items (until snoozed_until timestamp passes)
 * 2. Completed/resolved items
 * 3. Archived entities
 * 4. Inactive nonnegotiables
 * 5. Past calendar events (>1 hour ago)
 *
 * See docs/priority_system/02_proposed_model.md section "Rules & Filters"
 */
export function shouldExcludeFromPriority(item: any, sourceType: PrioritySourceType): boolean {
  // TODO: Implement full logic
  // This is a skeleton implementation

  const now = new Date();

  // 1. Snoozed items
  if (item.snoozed_until && parseISO(item.snoozed_until) > now) {
    return true;
  }

  // 2. Completed/resolved items
  if (sourceType === "task" && item.completed) {
    return true;
  }
  if (sourceType === "inbox" && item.is_resolved) {
    return true;
  }

  // 3. Archived entities
  if (sourceType === "portfolio_company" && item.status === "archived") {
    return true;
  }
  if (sourceType === "pipeline_company" && item.status === "passed") {
    return true;
  }

  // 4. Inactive nonnegotiables
  if (sourceType === "nonnegotiable" && !item.is_active) {
    return true;
  }

  // 5. Past calendar events (>1 hour ago)
  if (sourceType === "calendar_event" && item.start_time) {
    const hoursSinceStart = differenceInHours(now, parseISO(item.start_time));
    if (hoursSinceStart > 1) {
      return true;
    }
  }

  return false;
}

/**
 * Always Include: Certain items always appear regardless of score
 *
 * Always-include criteria:
 * 1. Overdue high-importance tasks (importance >= 0.8)
 * 2. Calendar events starting within 2 hours
 * 3. Today's active nonnegotiables (urgency >= 0.5)
 *
 * See docs/priority_system/02_proposed_model.md section "Rules & Filters"
 */
export function isAlwaysInclude(item: PriorityItem): boolean {
  // TODO: Implement full logic
  // This is a skeleton implementation

  // 1. Overdue high-importance tasks
  if (item.sourceType === "task" && item.isOverdue && item.importanceScore >= 0.8) {
    return true;
  }

  // 2. Calendar events starting within 2 hours
  if (item.sourceType === "calendar_event" && item.eventStartAt) {
    const now = new Date();
    const hoursUntil = differenceInHours(parseISO(item.eventStartAt), now);
    if (hoursUntil >= 0 && hoursUntil < 2) {
      return true;
    }
  }

  // 3. Today's active nonnegotiables
  if (item.sourceType === "nonnegotiable" && item.urgencyScore >= 0.5) {
    return true;
  }

  return false;
}

/**
 * Apply score threshold filter
 *
 * Filter out items with very low priority scores (below threshold).
 * These are "nice to have" but not actionable priorities.
 * Always-include items bypass this filter.
 *
 * Default threshold: 0.3
 *
 * See docs/priority_system/02_proposed_model.md section "Rules & Filters"
 */
export function applyScoreThreshold(
  items: PriorityItem[],
  config: PriorityConfig = DEFAULT_PRIORITY_CONFIG
): PriorityItem[] {
  // TODO: Implement full logic
  return items.filter(item => item.priorityScore >= config.minScore || isAlwaysInclude(item));
}

/**
 * Select top priority items with diversity and size constraints
 *
 * Algorithm:
 * 1. Separate "always include" items
 * 2. Sort remaining by priorityScore descending
 * 3. Ensure source diversity (max N items per source type)
 * 4. Limit total to maxItems
 * 5. Final sort by priorityScore
 *
 * Default: Max 10 items total, max 3 items per source type
 *
 * See docs/priority_system/02_proposed_model.md section "Rules & Filters"
 */
export function selectTopPriorityItems(
  allItems: PriorityItem[],
  config: PriorityConfig = DEFAULT_PRIORITY_CONFIG
): PriorityItem[] {
  // TODO: Implement full logic
  // This is a skeleton implementation

  const { maxItems, maxItemsPerSource } = config;

  // Step 1: Separate "always include" items
  const alwaysIncluded = allItems.filter(isAlwaysInclude);
  const remaining = allItems.filter(item => !isAlwaysInclude(item));

  // Step 2: Sort remaining by priorityScore descending
  remaining.sort((a, b) => b.priorityScore - a.priorityScore);

  // Step 3: Ensure source diversity
  const selected: PriorityItem[] = [...alwaysIncluded];
  const sourceTypeCounts = new Map<PrioritySourceType, number>();

  // Initialize counts for always-included items
  for (const item of alwaysIncluded) {
    const count = sourceTypeCounts.get(item.sourceType) || 0;
    sourceTypeCounts.set(item.sourceType, count + 1);
  }

  // Add remaining items with diversity constraint
  for (const item of remaining) {
    if (selected.length >= maxItems) break;

    const count = sourceTypeCounts.get(item.sourceType) || 0;

    // Allow max N items from same source type
    if (count < maxItemsPerSource) {
      selected.push(item);
      sourceTypeCounts.set(item.sourceType, count + 1);
    }
  }

  // Step 4: Final sort by priorityScore
  selected.sort((a, b) => b.priorityScore - a.priorityScore);

  return selected.slice(0, maxItems);
}

/**
 * Apply all filtering rules in sequence
 *
 * Full pipeline:
 * 1. Apply score threshold
 * 2. Select top items with diversity
 *
 * See docs/priority_system/02_proposed_model.md section "Rules & Filters"
 */
export function applyAllRules(
  items: PriorityItem[],
  config: PriorityConfig = DEFAULT_PRIORITY_CONFIG
): PriorityItem[] {
  // TODO: Implement full logic

  // Step 1: Apply score threshold
  const thresholdFiltered = applyScoreThreshold(items, config);

  // Step 2: Select top items with diversity
  const finalItems = selectTopPriorityItems(thresholdFiltered, config);

  return finalItems;
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
 * Helper: Validate priority item meets minimum requirements
 *
 * Ensures all required fields are present and scores are valid (0-1 range)
 */
export function validatePriorityItem(item: PriorityItem): boolean {
  // TODO: Implement full validation logic

  // Check required fields
  if (!item.id || !item.sourceType || !item.sourceId || !item.title) {
    return false;
  }

  // Check score ranges (0-1)
  const scores = [
    item.urgencyScore,
    item.importanceScore,
    item.recencyScore,
    item.commitmentScore,
    item.priorityScore,
  ];

  for (const score of scores) {
    if (score < 0 || score > 1) {
      return false;
    }
  }

  return true;
}
