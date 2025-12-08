/**
 * useUnifiedPriorityV1 Hook - Unified Priority Engine (v1)
 *
 * This is the v1 implementation of the unified priority system.
 * It combines 3 data sources into a single prioritized list:
 * - Tasks (all incomplete tasks)
 * - Inbox items (unread/unresolved)
 * - Calendar events (today + next 48 hours)
 *
 * Status: Phase 1 - v1 Implementation
 * See docs/priority_system/03_v1_tuning_guide.md for tuning instructions
 *
 * Scoring: 2-dimensional (urgency 60%, importance 40%)
 * Selection: Top 8 items, no diversity rules, no score thresholds
 *
 * v2+ will add:
 * - Portfolio/pipeline companies
 * - Reading list items
 * - Nonnegotiables
 * - Recency/commitment scoring
 * - Diversity rules
 */

import { useMemo } from 'react';
import { differenceInHours, parseISO } from 'date-fns';
import { useTasks } from './useTasks';
import { useInboxItems } from './useInboxItems';
import { useOutlookCalendar } from './useOutlookCalendar';
import type { PriorityItem } from '@/types/priority';
import { V1_PRIORITY_CONFIG } from '@/types/priority';
import {
  mapTaskToPriorityItemV1,
  mapInboxItemToPriorityItemV1,
  mapCalendarEventToPriorityItemV1,
} from '@/lib/priority/priorityMappingV1';
import {
  shouldExcludeV1,
  selectTopPriorityItemsV1,
  getSourceTypeDistribution,
  getAvgScore,
  getMinScore,
  getMaxScore,
  validatePriorityItem,
} from '@/lib/priority/priorityRulesV1';

export interface UnifiedPriorityV1Result {
  items: PriorityItem[];
  totalCount: number;
  loading: boolean;
  debug: {
    allItems: PriorityItem[];
    selected: PriorityItem[];
    distribution: Map<string, number>;
    avgScore: number;
    minScore: number;
    maxScore: number;
  };
}

/**
 * useUnifiedPriorityV1 Hook
 *
 * Combines tasks, inbox, and calendar into a unified priority list.
 * Returns top 8 items sorted by priority score.
 */
export function useUnifiedPriorityV1(): UnifiedPriorityV1Result {
  // Fetch data from all sources
  const { tasks, loading: tasksLoading } = useTasks();
  const { inboxItems, isLoading: inboxLoading } = useInboxItems();
  const { events, loading: calendarLoading } = useOutlookCalendar();

  const result = useMemo(() => {
    const now = new Date();
    const allItems: PriorityItem[] = [];

    // =========================================================================
    // 1. MAP TASKS
    // =========================================================================
    const incompleteTasks = tasks.filter(t => !t.completed);

    for (const task of incompleteTasks) {
      // Skip if excluded (completed, snoozed, etc.)
      if (shouldExcludeV1(task, "task")) {
        continue;
      }

      try {
        const priorityItem = mapTaskToPriorityItemV1(task);

        // Validate before adding
        if (validatePriorityItem(priorityItem)) {
          allItems.push(priorityItem);
        } else {
          console.warn(`[Priority v1] Invalid task item:`, priorityItem.id);
        }
      } catch (error) {
        console.error(`[Priority v1] Error mapping task ${task.id}:`, error);
      }
    }

    // =========================================================================
    // 2. MAP INBOX
    // =========================================================================
    const unresolvedInbox = inboxItems.filter(i => !i.isResolved && !i.isDeleted);

    for (const inboxItem of unresolvedInbox) {
      // Skip if excluded (resolved, snoozed, etc.)
      if (shouldExcludeV1(inboxItem, "inbox")) {
        continue;
      }

      try {
        const priorityItem = mapInboxItemToPriorityItemV1(inboxItem);

        // Validate before adding
        if (validatePriorityItem(priorityItem)) {
          allItems.push(priorityItem);
        } else {
          console.warn(`[Priority v1] Invalid inbox item:`, priorityItem.id);
        }
      } catch (error) {
        console.error(`[Priority v1] Error mapping inbox ${inboxItem.id}:`, error);
      }
    }

    // =========================================================================
    // 3. MAP CALENDAR (filter to next 48 hours)
    // =========================================================================
    const upcomingEvents = events.filter(event => {
      const hoursUntil = differenceInHours(parseISO(event.startTime), now);
      // Include events from -1 hour (just started) to +48 hours
      return hoursUntil >= -1 && hoursUntil <= V1_PRIORITY_CONFIG.calendarUpcomingWindow;
    });

    for (const event of upcomingEvents) {
      // Skip if excluded (past events, etc.)
      if (shouldExcludeV1(event, "calendar_event")) {
        continue;
      }

      try {
        const priorityItem = mapCalendarEventToPriorityItemV1(event);

        // Validate before adding
        if (validatePriorityItem(priorityItem)) {
          allItems.push(priorityItem);
        } else {
          console.warn(`[Priority v1] Invalid calendar item:`, priorityItem.id);
        }
      } catch (error) {
        console.error(`[Priority v1] Error mapping calendar ${event.id}:`, error);
      }
    }

    // =========================================================================
    // 4. SELECT TOP ITEMS
    // =========================================================================
    const selected = selectTopPriorityItemsV1(allItems);

    // =========================================================================
    // 5. DEBUG INFO
    // =========================================================================
    const distribution = getSourceTypeDistribution(selected);
    const avgScore = getAvgScore(selected);
    const minScore = getMinScore(selected);
    const maxScore = getMaxScore(selected);

    // Optional: Log in dev mode
    if (process.env.NODE_ENV === 'development') {
      console.log('[Priority v1] Distribution:', {
        totalItems: allItems.length,
        selected: selected.length,
        bySource: Object.fromEntries(distribution),
        avgScore: avgScore.toFixed(2),
        scoreRange: [minScore.toFixed(2), maxScore.toFixed(2)],
      });
    }

    return {
      items: selected,
      totalCount: allItems.length,
      loading: false,
      debug: {
        allItems,
        selected,
        distribution,
        avgScore,
        minScore,
        maxScore,
      },
    };
  }, [tasks, inboxItems, events]);

  // Loading state: return empty result if any source is still loading
  if (tasksLoading || inboxLoading || calendarLoading) {
    return {
      items: [],
      totalCount: 0,
      loading: true,
      debug: {
        allItems: [],
        selected: [],
        distribution: new Map(),
        avgScore: 0,
        minScore: 0,
        maxScore: 0,
      },
    };
  }

  return result;
}
