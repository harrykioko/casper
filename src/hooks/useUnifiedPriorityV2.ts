/**
 * useUnifiedPriorityV2 Hook - Full Coverage Priority Engine
 *
 * Combines 9 data sources into a single prioritized list:
 * - Tasks (all incomplete tasks)
 * - Inbox items (unread/unresolved)
 * - Calendar events (next 48 hours)
 * - Portfolio companies (stale = needs attention)
 * - Pipeline companies (active deals, next_steps)
 * - Reading list (unread items)
 * - Nonnegotiables (active habits)
 * - Commitments (promises made to others) [Phase 2]
 *
 * Features:
 * - 5-dimensional scoring (urgency, importance, commitment, recency, effort)
 * - Diversity rules (max 4 items per source)
 * - Minimum score threshold (0.2)
 * - Effort-based filtering (quick wins mode)
 *
 * Status: Phase 2 - Commitments Integration
 */

import { useMemo } from 'react';
import { differenceInHours, parseISO } from 'date-fns';
import { useTasks } from './useTasks';
import { useInboxItems } from './useInboxItems';
import { useOutlookCalendar } from './useOutlookCalendar';
import { useDashboardPortfolioCompanies } from './useDashboardPortfolioCompanies';
import { useDashboardPipelineFocus } from './useDashboardPipelineFocus';
import { useReadingItems } from './useReadingItems';
import { useNonnegotiables } from './useNonnegotiables';
import { useCommitments } from './useCommitments';
import { useDismissedPriorityItems } from './useDismissedPriorityItems';
import type { PriorityItem, PrioritySourceType } from '@/types/priority';
import { V2_PRIORITY_CONFIG } from '@/types/priority';
import {
  mapTaskToPriorityItemV2,
  mapInboxItemToPriorityItemV2,
  mapCalendarEventToPriorityItemV2,
  mapPortfolioCompanyToPriorityItemV2,
  mapPipelineCompanyToPriorityItemV2,
  mapReadingItemToPriorityItemV2,
  mapNonnegotiableToPriorityItemV2,
  mapCommitmentToPriorityItemV2,
} from '@/lib/priority/priorityMappingV2';

export interface UnifiedPriorityV2Options {
  /** Filter to items that fit in available minutes */
  availableMinutes?: number;
  /** Override max items (default: 12) */
  maxItems?: number;
  /** Override minimum score threshold (default: 0.2) */
  minScore?: number;
  /** Disable diversity rules */
  disableDiversity?: boolean;
  /** Source types to include (default: all) */
  includeSources?: PrioritySourceType[];
  /** Source types to exclude */
  excludeSources?: PrioritySourceType[];
}

export interface UnifiedPriorityV2Result {
  /** Top priority items after filtering and selection */
  items: PriorityItem[];
  /** Total count before selection */
  totalCount: number;
  /** Loading state */
  loading: boolean;
  /** Error if any source failed */
  error: string | null;
  /** Debug information */
  debug: {
    allItems: PriorityItem[];
    selected: PriorityItem[];
    distribution: Map<PrioritySourceType, number>;
    bySource: Record<PrioritySourceType, PriorityItem[]>;
    avgScore: number;
    minScore: number;
    maxScore: number;
    filterStats: {
      snoozed: number;
      belowThreshold: number;
      dismissed: number;
    };
  };
}

/**
 * useUnifiedPriorityV2 Hook
 *
 * Combines all 8 data sources into a unified priority list.
 */
export function useUnifiedPriorityV2(options?: UnifiedPriorityV2Options): UnifiedPriorityV2Result {
  // =========================================================================
  // FETCH ALL DATA SOURCES
  // =========================================================================
  const { tasks, loading: tasksLoading } = useTasks();
  const { inboxItems, isLoading: inboxLoading } = useInboxItems();
  const { events, loading: calendarLoading } = useOutlookCalendar();
  const { companies: portfolioCompanies, loading: portfolioLoading } = useDashboardPortfolioCompanies();
  const { companies: pipelineCompanies, loading: pipelineLoading } = useDashboardPipelineFocus();
  const { readingItems, loading: readingLoading } = useReadingItems();
  const { nonnegotiables, loading: nonnegotiablesLoading } = useNonnegotiables();
  const { commitments, loading: commitmentsLoading } = useCommitments({ status: 'open' });
  const { dismissedSet, loading: dismissedLoading } = useDismissedPriorityItems();

  // =========================================================================
  // COMPUTE PRIORITY LIST
  // =========================================================================
  const result = useMemo(() => {
    const now = new Date();
    const allItems: PriorityItem[] = [];
    const filterStats = { snoozed: 0, belowThreshold: 0, dismissed: 0 };

    const includeSources = new Set(options?.includeSources || [
      'task', 'inbox', 'calendar_event', 'portfolio_company',
      'pipeline_company', 'reading_item', 'nonnegotiable', 'commitment'
    ]);
    const excludeSources = new Set(options?.excludeSources || []);

    const shouldInclude = (source: PrioritySourceType) =>
      includeSources.has(source) && !excludeSources.has(source);

    // -----------------------------------------------------------------------
    // 1. MAP TASKS
    // -----------------------------------------------------------------------
    if (shouldInclude('task')) {
      const incompleteTasks = tasks.filter(t => !t.completed);

      for (const task of incompleteTasks) {
        // Skip snoozed
        if ((task as any).snoozed_until) {
          const snoozedUntil = parseISO((task as any).snoozed_until);
          if (snoozedUntil > now) {
            filterStats.snoozed++;
            continue;
          }
        }

        // Skip dismissed
        if (dismissedSet.has(`task-${task.id}`)) {
          filterStats.dismissed++;
          continue;
        }

        try {
          const priorityItem = mapTaskToPriorityItemV2(task, {
            availableMinutes: options?.availableMinutes,
          });
          allItems.push(priorityItem);
        } catch (error) {
          console.error(`[Priority v2] Error mapping task ${task.id}:`, error);
        }
      }
    }

    // -----------------------------------------------------------------------
    // 2. MAP INBOX
    // -----------------------------------------------------------------------
    if (shouldInclude('inbox')) {
      const unresolvedInbox = inboxItems.filter(i => !i.isResolved && !i.isDeleted);

      for (const inboxItem of unresolvedInbox) {
        // Skip snoozed
        if (inboxItem.snoozedUntil) {
          const snoozedUntil = parseISO(inboxItem.snoozedUntil);
          if (snoozedUntil > now) {
            filterStats.snoozed++;
            continue;
          }
        }

        // Skip dismissed
        if (dismissedSet.has(`inbox-${inboxItem.id}`)) {
          filterStats.dismissed++;
          continue;
        }

        try {
          const priorityItem = mapInboxItemToPriorityItemV2(inboxItem);
          allItems.push(priorityItem);
        } catch (error) {
          console.error(`[Priority v2] Error mapping inbox ${inboxItem.id}:`, error);
        }
      }
    }

    // -----------------------------------------------------------------------
    // 3. MAP CALENDAR (next 48 hours)
    // -----------------------------------------------------------------------
    if (shouldInclude('calendar_event')) {
      const upcomingEvents = events.filter(event => {
        const hoursUntil = differenceInHours(parseISO(event.startTime), now);
        return hoursUntil >= -1 && hoursUntil <= V2_PRIORITY_CONFIG.calendarUpcomingWindow;
      });

      for (const event of upcomingEvents) {
        // Skip dismissed
        const dismissalId = event.microsoftEventId || event.id;
        if (dismissedSet.has(`calendar_event-${dismissalId}`)) {
          filterStats.dismissed++;
          continue;
        }

        try {
          const priorityItem = mapCalendarEventToPriorityItemV2(event);
          allItems.push(priorityItem);
        } catch (error) {
          console.error(`[Priority v2] Error mapping calendar ${event.id}:`, error);
        }
      }
    }

    // -----------------------------------------------------------------------
    // 4. MAP PORTFOLIO COMPANIES (stale ones)
    // -----------------------------------------------------------------------
    if (shouldInclude('portfolio_company')) {
      for (const company of portfolioCompanies) {
        // Only include companies that need attention (stale or have open tasks)
        const isStale = !company.last_interaction_at ||
          differenceInHours(now, parseISO(company.last_interaction_at)) >=
          V2_PRIORITY_CONFIG.companyStaleThreshold * 24;
        const hasOpenTasks = company.open_task_count > 0;

        if (!isStale && !hasOpenTasks) {
          continue;
        }

        // Skip dismissed
        if (dismissedSet.has(`portfolio_company-${company.id}`)) {
          filterStats.dismissed++;
          continue;
        }

        try {
          const priorityItem = mapPortfolioCompanyToPriorityItemV2(company);
          allItems.push(priorityItem);
        } catch (error) {
          console.error(`[Priority v2] Error mapping portfolio ${company.id}:`, error);
        }
      }
    }

    // -----------------------------------------------------------------------
    // 5. MAP PIPELINE COMPANIES (active/top-of-mind)
    // -----------------------------------------------------------------------
    if (shouldInclude('pipeline_company')) {
      for (const company of pipelineCompanies) {
        // Skip passed deals
        if (company.status === 'passed') {
          continue;
        }

        // Skip dismissed
        if (dismissedSet.has(`pipeline_company-${company.id}`)) {
          filterStats.dismissed++;
          continue;
        }

        try {
          const priorityItem = mapPipelineCompanyToPriorityItemV2(company);
          allItems.push(priorityItem);
        } catch (error) {
          console.error(`[Priority v2] Error mapping pipeline ${company.id}:`, error);
        }
      }
    }

    // -----------------------------------------------------------------------
    // 6. MAP READING LIST (unread only)
    // -----------------------------------------------------------------------
    if (shouldInclude('reading_item')) {
      const unreadItems = readingItems.filter(item => !item.isRead);

      // Limit to most recent 5 unread items to avoid overwhelming
      const recentUnread = unreadItems.slice(0, 5);

      for (const item of recentUnread) {
        // Skip dismissed
        if (dismissedSet.has(`reading_item-${item.id}`)) {
          filterStats.dismissed++;
          continue;
        }

        try {
          const priorityItem = mapReadingItemToPriorityItemV2(item);
          allItems.push(priorityItem);
        } catch (error) {
          console.error(`[Priority v2] Error mapping reading ${item.id}:`, error);
        }
      }
    }

    // -----------------------------------------------------------------------
    // 7. MAP NONNEGOTIABLES (active only)
    // -----------------------------------------------------------------------
    if (shouldInclude('nonnegotiable')) {
      const activeNonnegotiables = nonnegotiables.filter(n => n.is_active !== false);

      for (const item of activeNonnegotiables) {
        // Skip dismissed
        if (dismissedSet.has(`nonnegotiable-${item.id}`)) {
          filterStats.dismissed++;
          continue;
        }

        try {
          const priorityItem = mapNonnegotiableToPriorityItemV2(item);
          allItems.push(priorityItem);
        } catch (error) {
          console.error(`[Priority v2] Error mapping nonnegotiable ${item.id}:`, error);
        }
      }
    }

    // -----------------------------------------------------------------------
    // 8. MAP COMMITMENTS (open promises) [Phase 2]
    // -----------------------------------------------------------------------
    if (shouldInclude('commitment')) {
      for (const commitment of commitments) {
        // Skip snoozed
        if (commitment.snoozedUntil) {
          const snoozedUntil = parseISO(commitment.snoozedUntil);
          if (snoozedUntil > now) {
            filterStats.snoozed++;
            continue;
          }
        }

        // Skip dismissed
        if (dismissedSet.has(`commitment-${commitment.id}`)) {
          filterStats.dismissed++;
          continue;
        }

        try {
          const priorityItem = mapCommitmentToPriorityItemV2(commitment);
          allItems.push(priorityItem);
        } catch (error) {
          console.error(`[Priority v2] Error mapping commitment ${commitment.id}:`, error);
        }
      }
    }

    // -----------------------------------------------------------------------
    // 9. APPLY MINIMUM SCORE THRESHOLD
    // -----------------------------------------------------------------------
    const minScore = options?.minScore ?? V2_PRIORITY_CONFIG.minScore;
    const aboveThreshold = allItems.filter(item => {
      if (item.priorityScore < minScore) {
        filterStats.belowThreshold++;
        return false;
      }
      return true;
    });

    // -----------------------------------------------------------------------
    // 10. APPLY DIVERSITY RULES
    // -----------------------------------------------------------------------
    let selected: PriorityItem[];

    if (options?.disableDiversity) {
      // No diversity rules - just sort and take top N
      selected = aboveThreshold
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .slice(0, options?.maxItems ?? V2_PRIORITY_CONFIG.maxItems);
    } else {
      selected = applyDiversityRules(
        aboveThreshold,
        options?.maxItems ?? V2_PRIORITY_CONFIG.maxItems,
        V2_PRIORITY_CONFIG.maxItemsPerSource
      );
    }

    // -----------------------------------------------------------------------
    // 11. COMPUTE DEBUG INFO
    // -----------------------------------------------------------------------
    const distribution = new Map<PrioritySourceType, number>();
    const bySource: Record<string, PriorityItem[]> = {};

    for (const item of selected) {
      distribution.set(item.sourceType, (distribution.get(item.sourceType) || 0) + 1);
      if (!bySource[item.sourceType]) {
        bySource[item.sourceType] = [];
      }
      bySource[item.sourceType].push(item);
    }

    const scores = selected.map(i => i.priorityScore);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const minScoreActual = scores.length > 0 ? Math.min(...scores) : 0;
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;

    // Log in dev mode
    if (process.env.NODE_ENV === 'development') {
      console.log('[Priority v2] Distribution:', {
        totalItems: allItems.length,
        selected: selected.length,
        bySource: Object.fromEntries(distribution),
        avgScore: avgScore.toFixed(2),
        scoreRange: [minScoreActual.toFixed(2), maxScore.toFixed(2)],
        filterStats,
      });
    }

    return {
      items: selected,
      totalCount: allItems.length,
      loading: false,
      error: null,
      debug: {
        allItems,
        selected,
        distribution,
        bySource: bySource as Record<PrioritySourceType, PriorityItem[]>,
        avgScore,
        minScore: minScoreActual,
        maxScore,
        filterStats,
      },
    };
  }, [
    tasks,
    inboxItems,
    events,
    portfolioCompanies,
    pipelineCompanies,
    readingItems,
    nonnegotiables,
    commitments,
    dismissedSet,
    options?.availableMinutes,
    options?.maxItems,
    options?.minScore,
    options?.disableDiversity,
    options?.includeSources,
    options?.excludeSources,
  ]);

  // =========================================================================
  // LOADING STATE
  // =========================================================================
  const isLoading = tasksLoading || inboxLoading || calendarLoading ||
                    portfolioLoading || pipelineLoading || readingLoading ||
                    nonnegotiablesLoading || commitmentsLoading || dismissedLoading;

  if (isLoading) {
    return {
      items: [],
      totalCount: 0,
      loading: true,
      error: null,
      debug: {
        allItems: [],
        selected: [],
        distribution: new Map(),
        bySource: {} as Record<PrioritySourceType, PriorityItem[]>,
        avgScore: 0,
        minScore: 0,
        maxScore: 0,
        filterStats: { snoozed: 0, belowThreshold: 0, dismissed: 0 },
      },
    };
  }

  return result;
}

/**
 * Apply diversity rules to prevent any single source from dominating
 *
 * Algorithm:
 * 1. Sort all items by priority score
 * 2. Iterate through, keeping track of count per source
 * 3. Skip items that would exceed maxItemsPerSource
 * 4. Stop when we have maxItems total
 */
function applyDiversityRules(
  items: PriorityItem[],
  maxItems: number,
  maxPerSource: number
): PriorityItem[] {
  // Sort by priority score descending
  const sorted = [...items].sort((a, b) => b.priorityScore - a.priorityScore);

  const selected: PriorityItem[] = [];
  const countPerSource = new Map<PrioritySourceType, number>();

  for (const item of sorted) {
    if (selected.length >= maxItems) {
      break;
    }

    const currentCount = countPerSource.get(item.sourceType) || 0;
    if (currentCount >= maxPerSource) {
      continue; // Skip - this source has enough items
    }

    selected.push(item);
    countPerSource.set(item.sourceType, currentCount + 1);
  }

  return selected;
}

/**
 * Hook variant for quick wins mode
 * Only returns items that fit in the available time
 */
export function useQuickWins(availableMinutes: number): UnifiedPriorityV2Result {
  return useUnifiedPriorityV2({
    availableMinutes,
    includeSources: ['task'], // Only tasks have effort estimates
    disableDiversity: true,
    maxItems: 5,
    minScore: 0.1, // Lower threshold for quick wins
  });
}
