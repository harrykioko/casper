import { useMemo } from "react";
import type { TriageQueueItem, TriageCounts } from "./useTriageQueue";
import type { CalendarEvent } from "@/types/outlook";
import type { WorkItemSourceType, EffortEstimate } from "./useWorkQueue";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InsightLine {
  key: string;
  icon: string; // lucide icon name or emoji
  text: string;
  tone: "neutral" | "warn" | "urgent";
}

export interface GuidedFilters {
  sourceTypes?: WorkItemSourceType[];
  effortFilter?: EffortEstimate;
  minPriorityScore?: number;
  maxPriorityScore?: number;
}

export interface SuggestedMove {
  id: string;
  type: string;
  actionType: "filter-scroll" | "open-item";
  label: string;
  timeEstimate: string;
  rationale: string;
  priority: number;
  guidedFilters?: GuidedFilters;
  targetItemId?: string;
}

export interface GuidedOverlay {
  active: boolean;
  moveLabel: string;
  filters: GuidedFilters;
}

interface UseActionIntelligenceInput {
  allItems: TriageQueueItem[];
  counts: TriageCounts;
  events: CalendarEvent[];
  isCalendarConnected: boolean;
  now: Date;
}

interface UseActionIntelligenceOutput {
  insights: InsightLine[];
  suggestions: SuggestedMove[];
  lastUpdatedAt: Date;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useActionIntelligence({
  allItems,
  counts,
  events,
  isCalendarConnected,
  now,
}: UseActionIntelligenceInput): UseActionIntelligenceOutput {
  // ------ Insights ------
  const insights = useMemo<InsightLine[]>(() => {
    if (allItems.length === 0) return [];

    const lines: InsightLine[] = [];

    // 1. Urgency — items with priorityScore >= 0.7
    const urgentCount = allItems.filter(i => i.priorityScore >= 0.7).length;
    if (urgentCount > 0) {
      lines.push({
        key: "urgent",
        icon: "AlertTriangle",
        text: `${urgentCount} urgent item${urgentCount !== 1 ? "s" : ""} need attention`,
        tone: "urgent",
      });
    }

    // 2. Overdue — items with score >= 0.9 are likely overdue
    const overdueCount = allItems.filter(i => i.priorityScore >= 0.9).length;
    if (overdueCount > 0) {
      lines.push({
        key: "overdue",
        icon: "Clock",
        text: `${overdueCount} likely overdue`,
        tone: "warn",
      });
    }

    // 3. Effort breakdown
    const { quick = 0, medium = 0, long: longCount = 0 } = counts.byEffort;
    const effortParts: string[] = [];
    if (quick > 0) effortParts.push(`${quick} quick win${quick !== 1 ? "s" : ""}`);
    if (medium > 0) effortParts.push(`${medium} medium`);
    if (longCount > 0) effortParts.push(`${longCount} long`);
    if (effortParts.length > 0) {
      lines.push({
        key: "effort",
        icon: "Zap",
        text: effortParts.join(", "),
        tone: "neutral",
      });
    }

    // 4. Type dominance — if one source > 50%
    const total = counts.total;
    if (total > 0) {
      const entries = Object.entries(counts.bySource) as [WorkItemSourceType, number][];
      const dominant = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
      if (dominant[1] > total * 0.5 && dominant[1] >= 2) {
        const label = sourceLabel(dominant[0]);
        lines.push({
          key: "dominance",
          icon: "Layers",
          text: `Mostly ${label} today (${dominant[1]} of ${total})`,
          tone: "neutral",
        });
      }
    }

    // 5. Timing risk — next meeting proximity
    if (isCalendarConnected && events.length > 0) {
      const nextEvent = events
        .filter(e => e.startTime && new Date(e.startTime) > now)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];
      if (nextEvent) {
        const minsUntil = Math.round(
          (new Date(nextEvent.startTime).getTime() - now.getTime()) / 60_000
        );
        if (minsUntil < 30 && minsUntil > 0) {
          lines.push({
            key: "timing",
            icon: "Timer",
            text: `Only ${minsUntil}m before next meeting`,
            tone: "warn",
          });
        }
      }
    }

    return lines;
  }, [allItems, counts, events, isCalendarConnected, now]);

  // ------ Suggested Moves ------
  const suggestions = useMemo<SuggestedMove[]>(() => {
    if (allItems.length === 0) return [];

    const moves: SuggestedMove[] = [];

    // 1. urgent-focus — critical items >= 1
    const criticalItems = allItems.filter(i => i.priorityScore >= 0.7);
    if (criticalItems.length >= 1) {
      moves.push({
        id: "urgent-focus",
        type: "urgent-focus",
        actionType: "filter-scroll",
        label: `Tackle ${criticalItems.length} urgent item${criticalItems.length !== 1 ? "s" : ""}`,
        timeEstimate: estimateTime(criticalItems),
        rationale: "These have the highest priority scores and need immediate attention",
        priority: 80 + Math.min(criticalItems.length, 10),
        guidedFilters: { minPriorityScore: 0.7 },
      });
    }

    // 2. window-matched — calendar connected + window >= 15m + matching items
    if (events.length > 0) {
      const nextWindow = findNextWindow(events, now);
      if (nextWindow && nextWindow >= 15) {
        const effortMatch: EffortEstimate = nextWindow <= 20 ? "quick" : nextWindow <= 45 ? "medium" : "long";
        const matchingCount = allItems.filter(i => i.effortEstimate === effortMatch).length;
        if (matchingCount > 0) {
          moves.push({
            id: "window-matched",
            type: "window-matched",
            actionType: "filter-scroll",
            label: `Fill ${nextWindow}m window with ${effortMatch} tasks`,
            timeEstimate: `~${nextWindow}m`,
            rationale: `${matchingCount} ${effortMatch} item${matchingCount !== 1 ? "s" : ""} fit this window`,
            priority: 60 + Math.min(matchingCount * 2, 15),
            guidedFilters: { effortFilter: effortMatch },
          });
        }
      }
    }

    // 3. quick-clear — quick items >= 2
    const quickItems = allItems.filter(i => i.effortEstimate === "quick");
    if (quickItems.length >= 2) {
      moves.push({
        id: "quick-clear",
        type: "quick-clear",
        actionType: "filter-scroll",
        label: `Clear ${quickItems.length} quick wins`,
        timeEstimate: `~${quickItems.length * 5}m`,
        rationale: "Knock out fast items to build momentum",
        priority: 50 + Math.min(quickItems.length, 10),
        guidedFilters: { effortFilter: "quick" },
      });
    }

    // 4. batch-by-entity — any source type >= 4
    const entries = Object.entries(counts.bySource) as [WorkItemSourceType, number][];
    const dominant = entries.filter(([, count]) => count >= 4).sort((a, b) => b[1] - a[1]);
    if (dominant.length > 0) {
      const [sourceType, count] = dominant[0];
      moves.push({
        id: "batch-by-entity",
        type: "batch-by-entity",
        actionType: "filter-scroll",
        label: `Batch ${count} ${sourceLabel(sourceType)} items`,
        timeEstimate: estimateTimeForCount(count),
        rationale: `Group similar items for faster processing`,
        priority: 40 + Math.min(count, 10),
        guidedFilters: { sourceTypes: [sourceType] },
      });
    }

    // 5. defer-low-priority — items with score < 0.4 >= 3
    const lowPriItems = allItems.filter(i => i.priorityScore < 0.4);
    if (lowPriItems.length >= 3) {
      moves.push({
        id: "defer-low-priority",
        type: "defer-low-priority",
        actionType: "filter-scroll",
        label: `Review ${lowPriItems.length} low-priority items`,
        timeEstimate: `~${lowPriItems.length * 2}m`,
        rationale: "Snooze or dismiss items that can wait",
        priority: 30,
        guidedFilters: { maxPriorityScore: 0.4 },
      });
    }

    // Sort by priority descending, cap at 5
    return moves.sort((a, b) => b.priority - a.priority).slice(0, 5);
  }, [allItems, counts, events, now]);

  return {
    insights,
    suggestions,
    lastUpdatedAt: now,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sourceLabel(type: WorkItemSourceType): string {
  switch (type) {
    case "email": return "email";
    case "calendar_event": return "calendar";
    case "task": return "task";
    case "note": return "note";
    case "reading": return "reading";
    case "commitment": return "commitment";
    default: return type;
  }
}

function estimateTime(items: TriageQueueItem[]): string {
  let mins = 0;
  for (const item of items) {
    if (item.effortEstimate === "quick") mins += 5;
    else if (item.effortEstimate === "medium") mins += 15;
    else mins += 30;
  }
  return `~${mins}m`;
}

function estimateTimeForCount(count: number): string {
  return `~${count * 5}m`;
}

function findNextWindow(events: CalendarEvent[], now: Date): number | null {
  const futureEvents = events
    .filter(e => e.startTime && new Date(e.startTime) > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  if (futureEvents.length === 0) return null;

  const gap = Math.round(
    (new Date(futureEvents[0].startTime).getTime() - now.getTime()) / 60_000
  );
  return gap >= 15 ? gap : null;
}
