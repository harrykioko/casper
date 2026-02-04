import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBackfillWorkItems } from "./useBackfillWorkItems";
import type { WorkItemSourceType, WorkItemStatus, WorkQueueItem, EffortEstimate } from "./useWorkQueue";
import {
  computePriorityScoreV1,
  computeTaskUrgencyScore,
  computeTaskImportanceScore,
  computeInboxUrgencyScore,
  computeInboxImportanceScore,
  computeCalendarUrgencyScore,
  computeCalendarImportanceScore,
  computeCommitmentUrgencyScore,
  computeCommitmentImportanceScore,
} from "@/lib/priority/priorityScoringV1";

export interface TriageFilters {
  sourceTypes: WorkItemSourceType[];
  reasonCodes: string[];
  effortFilter: EffortEstimate | null;
}

export interface TriageCounts {
  total: number;
  bySource: Record<WorkItemSourceType, number>;
  byReason: Record<string, number>;
  byEffort: Record<EffortEstimate, number>;
}

export interface TriageQueueItem extends WorkQueueItem {
  priorityScore: number;
  source_url?: string; // URL for reading items
  effortEstimate: EffortEstimate;
}

export function useTriageQueue() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Run backfill on mount
  useBackfillWorkItems();

  // Filter state
  const [filters, setFilters] = useState<TriageFilters>({
    sourceTypes: [],
    reasonCodes: [],
    effortFilter: null,
  });

  const toggleSourceType = useCallback((type: WorkItemSourceType) => {
    setFilters(prev => ({
      ...prev,
      sourceTypes: prev.sourceTypes.includes(type)
        ? prev.sourceTypes.filter(t => t !== type)
        : [...prev.sourceTypes, type],
    }));
  }, []);

  const toggleReasonCode = useCallback((code: string) => {
    setFilters(prev => ({
      ...prev,
      reasonCodes: prev.reasonCodes.includes(code)
        ? prev.reasonCodes.filter(c => c !== code)
        : [...prev.reasonCodes, code],
    }));
  }, []);

  const setEffortFilter = useCallback((effort: EffortEstimate | null) => {
    setFilters(prev => ({
      ...prev,
      effortFilter: prev.effortFilter === effort ? null : effort,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ sourceTypes: [], reasonCodes: [], effortFilter: null });
  }, []);

  // Use both query keys so invalidation from backfill works
  const queryKey = ["triage_queue", user?.id];

  const { data, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id) return { items: [], counts: emptyCounts() };

      const now = new Date().toISOString();

      // Try marking stale items (safe to fail if migration not deployed)
      const rpcResult = await (supabase.rpc as any)("mark_stale_work_items", { p_user_id: user.id });
      if (rpcResult.error) {
        console.warn("[Focus Queue] mark_stale_work_items RPC not available:", rpcResult.error.message);
      }

      // Debug: check total work_items for this user
      const { data: allWi, error: allWiErr } = await supabase
        .from("work_items")
        .select("id, status, source_type")
        .eq("created_by", user.id);

      if (allWiErr) {
        console.error("[Focus Queue] Error checking all work items:", allWiErr);
      } else {
        const statusCounts: Record<string, number> = {};
        for (const wi of allWi || []) {
          statusCounts[wi.status] = (statusCounts[wi.status] || 0) + 1;
        }
        console.log("[Focus Queue] All work items for user:", {
          total: (allWi || []).length,
          byStatus: statusCounts,
        });
      }

      // Fetch active work items (needs_review, enriched_pending, snoozed with expired snooze)
      const { data: workItems, error } = await supabase
        .from("work_items")
        .select("*")
        .eq("created_by", user.id)
        .in("status", ["needs_review", "enriched_pending", "snoozed"])
        .order("created_at", { ascending: true });

      if (error) {
        console.error("[Focus Queue] Error fetching work items:", error);
        throw error;
      }

      console.log("[Focus Queue] Active work items fetched:", (workItems || []).length);

      // Filter expired snoozed items back in
      let items = (workItems || []).filter(item => {
        if (item.status === "snoozed") {
          return item.snooze_until && new Date(item.snooze_until) <= new Date(now);
        }
        return true;
      });

      // Fetch entity links
      const entityLinks: Record<string, { target_type: string; target_id: string; link_reason: string | null }> = {};
      if (items.length > 0) {
        const { data: links } = await supabase
          .from("entity_links")
          .select("source_type, source_id, target_type, target_id, link_reason")
          .eq("created_by", user.id);

        const itemKeys = new Set(items.map(i => `${i.source_type}:${i.source_id}`));
        for (const link of links || []) {
          const key = `${link.source_type}:${link.source_id}`;
          if (itemKeys.has(key)) {
            entityLinks[key] = { target_type: link.target_type, target_id: link.target_id, link_reason: link.link_reason };
          }
        }
      }

      // Fetch extracts for one-liners
      const extracts: Record<string, string> = {};
      if (items.length > 0) {
        const { data: extractData } = await supabase
          .from("item_extracts")
          .select("source_type, source_id, content")
          .eq("created_by", user.id)
          .eq("extract_type", "summary");

        for (const ext of extractData || []) {
          const key = `${ext.source_type}:${ext.source_id}`;
          const content = ext.content as any;
          if (content?.one_liner) {
            extracts[key] = content.one_liner;
          }
        }
      }

      // Fetch source titles + source records for scoring
      const sourceData = await fetchSourceData(items, user.id);

      // Compose items with priority scores, reconciling stale reason codes
      const composedItems: TriageQueueItem[] = [];
      const autoResolveIds: string[] = [];

      for (const item of items) {
        const key = `${item.source_type}:${item.source_id}`;
        const sd = sourceData[key];
        const priorityScore = computeItemScore(item.source_type, sd?.scoreData);
        const hasLink = !!entityLinks[key] || !!sd?.hasSourceLink;

        // Reconcile reason_codes: remove unlinked_company if item now has a link
        let reasonCodes = item.reason_codes || [];
        if (hasLink && reasonCodes.includes("unlinked_company")) {
          reasonCodes = reasonCodes.filter((c: string) => c !== "unlinked_company");
          // Persist the fix back to DB (fire-and-forget)
          supabase
            .from("work_items")
            .update({ reason_codes: reasonCodes })
            .eq("id", item.id)
            .then();
        }

        // If all reason codes are now cleared, auto-resolve to trusted
        if (reasonCodes.length === 0) {
          autoResolveIds.push(item.id);
          continue; // Don't include in the focus list
        }

        composedItems.push({
          ...item,
          status: item.status as WorkItemStatus,
          source_type: item.source_type as WorkItemSourceType,
          reason_codes: reasonCodes,
          source_title: sd?.title || "Untitled",
          source_snippet: sd?.snippet || undefined,
          source_url: sd?.url || undefined,
          primary_link: entityLinks[key] || null,
          one_liner: extracts[key] || null,
          priorityScore,
          effortEstimate: sd?.effortEstimate || 'medium',
        });
      }

      // Auto-resolve fully-linked items (fire-and-forget)
      if (autoResolveIds.length > 0) {
        console.log(`[Focus Queue] Auto-resolving ${autoResolveIds.length} fully-linked items`);
        supabase
          .from("work_items")
          .update({ status: "trusted", trusted_at: new Date().toISOString(), reason_codes: [] })
          .in("id", autoResolveIds)
          .then();
      }

      // Sort by priority score descending
      composedItems.sort((a, b) => b.priorityScore - a.priorityScore);

      // Compute counts
      const counts = computeCounts(composedItems);

      return { items: composedItems, counts };
    },
    enabled: !!user?.id,
    // Re-fetch when work_queue is invalidated (from backfill or triage actions)
    refetchOnWindowFocus: false,
  });

  // Apply client-side filters
  const filteredItems = useMemo(() => {
    let result = data?.items || [];

    if (filters.sourceTypes.length > 0) {
      result = result.filter(item => filters.sourceTypes.includes(item.source_type));
    }
    if (filters.reasonCodes.length > 0) {
      result = result.filter(item =>
        filters.reasonCodes.some(code => item.reason_codes.includes(code))
      );
    }
    if (filters.effortFilter) {
      result = result.filter(item => item.effortEstimate === filters.effortFilter);
    }

    return result;
  }, [data?.items, filters]);

  const isAllClear = data ? data.items.length === 0 : false;

  // Optimistic remove - instantly remove item from cache before mutation completes
  const optimisticRemove = useCallback(
    (workItemId: string) => {
      queryClient.setQueryData(queryKey, (oldData: { items: TriageQueueItem[]; counts: TriageCounts } | undefined) => {
        if (!oldData) return oldData;
        const newItems = oldData.items.filter((item: TriageQueueItem) => item.id !== workItemId);
        return {
          ...oldData,
          items: newItems,
          counts: computeCounts(newItems),
        };
      });
    },
    [queryClient, queryKey]
  );

  return {
    items: filteredItems,
    allItems: data?.items || [],
    counts: data?.counts || emptyCounts(),
    isLoading,
    isAllClear,
    filters,
    toggleSourceType,
    toggleReasonCode,
    setEffortFilter,
    clearFilters,
    refetch,
    optimisticRemove,
  };
}

function emptyCounts(): TriageCounts {
  return {
    total: 0,
    bySource: { email: 0, calendar_event: 0, task: 0, note: 0, reading: 0, commitment: 0 },
    byReason: {},
    byEffort: { quick: 0, medium: 0, long: 0 },
  };
}

function computeCounts(items: TriageQueueItem[]): TriageCounts {
  const bySource: Record<WorkItemSourceType, number> = { email: 0, calendar_event: 0, task: 0, note: 0, reading: 0, commitment: 0 };
  const byReason: Record<string, number> = {};
  const byEffort: Record<EffortEstimate, number> = { quick: 0, medium: 0, long: 0 };

  for (const item of items) {
    bySource[item.source_type] = (bySource[item.source_type] || 0) + 1;
    for (const code of item.reason_codes) {
      byReason[code] = (byReason[code] || 0) + 1;
    }
    byEffort[item.effortEstimate] = (byEffort[item.effortEstimate] || 0) + 1;
  }

  return { total: items.length, bySource, byReason, byEffort };
}

interface SourceDataEntry {
  title: string;
  snippet?: string;
  url?: string; // URL for reading items
  scoreData?: any;
  /** True if the source record itself has a company/project link (e.g. inbox_items.related_company_id) */
  hasSourceLink?: boolean;
  effortEstimate?: EffortEstimate;
}

async function fetchSourceData(
  items: Array<{ source_type: string; source_id: string }>,
  userId: string
): Promise<Record<string, SourceDataEntry>> {
  const result: Record<string, SourceDataEntry> = {};
  const byType: Record<string, string[]> = {};

  for (const item of items) {
    if (!byType[item.source_type]) byType[item.source_type] = [];
    byType[item.source_type].push(item.source_id);
  }

  const fetches: (() => Promise<void>)[] = [];

  if (byType["email"]?.length) {
    fetches.push(async () => {
      const { data } = await supabase
        .from("inbox_items")
        .select("id, subject, snippet, display_subject, display_snippet, received_at, is_read, related_company_id")
        .in("id", byType["email"]);

      // Batch-fetch inbox_suggestions for effort_bucket
      const { data: suggestions } = await supabase
        .from("inbox_suggestions")
        .select("inbox_item_id, suggestions")
        .in("inbox_item_id", byType["email"]);

      const effortOrder: Record<string, number> = { quick: 0, medium: 1, long: 2 };
      const effortByEmail: Record<string, EffortEstimate> = {};
      for (const sug of suggestions || []) {
        const sugList = (sug.suggestions as any[]) || [];
        for (const s of sugList) {
          const bucket = s.effort_bucket as EffortEstimate | undefined;
          if (bucket && effortOrder[bucket] !== undefined) {
            const current = effortByEmail[sug.inbox_item_id];
            if (!current || effortOrder[bucket] > effortOrder[current]) {
              effortByEmail[sug.inbox_item_id] = bucket;
            }
          }
        }
      }

      for (const row of data || []) {
        result[`email:${row.id}`] = {
          title: row.display_subject || row.subject || "No subject",
          snippet: row.display_snippet || row.snippet || undefined,
          scoreData: { receivedAt: row.received_at, isRead: row.is_read },
          hasSourceLink: !!row.related_company_id,
          effortEstimate: effortByEmail[row.id] || 'quick',
        };
      }
    });
  }

  if (byType["calendar_event"]?.length) {
    fetches.push(async () => {
      const { data } = await supabase
        .from("calendar_events")
        .select("id, title, start_time")
        .in("id", byType["calendar_event"]);

      // Also check calendar_event_links for company associations
      const { data: calLinks } = await supabase
        .from("calendar_event_links")
        .select("calendar_event_id, company_id")
        .in("calendar_event_id", byType["calendar_event"]);

      const linkedEventIds = new Set(
        (calLinks || []).filter(l => l.company_id).map(l => l.calendar_event_id)
      );

      for (const row of data || []) {
        result[`calendar_event:${row.id}`] = {
          title: row.title || "No title",
          scoreData: { startTime: row.start_time },
          hasSourceLink: linkedEventIds.has(row.id),
          effortEstimate: 'medium',
        };
      }
    });
  }

  if (byType["task"]?.length) {
    fetches.push(async () => {
      const { data } = await supabase
        .from("tasks")
        .select("id, content, scheduled_for, priority, project_id, company_id, pipeline_company_id, is_quick_task")
        .in("id", byType["task"]);
      for (const row of data || []) {
        let taskEffort: EffortEstimate = 'medium';
        if ((row as any).is_quick_task) taskEffort = 'quick';
        result[`task:${row.id}`] = {
          title: row.content || "Untitled task",
          scoreData: { scheduledFor: row.scheduled_for, priority: row.priority },
          hasSourceLink: !!(row.project_id || row.company_id || row.pipeline_company_id),
          effortEstimate: taskEffort,
        };
      }
    });
  }

  if (byType["note"]?.length) {
    fetches.push(async () => {
      const { data } = await supabase
        .from("project_notes")
        .select("id, title, content, project_id")
        .in("id", byType["note"]);
      for (const row of data || []) {
        result[`note:${row.id}`] = {
          title: row.title || "Untitled note",
          snippet: row.content?.substring(0, 120) || undefined,
          scoreData: {},
          hasSourceLink: !!row.project_id,
          effortEstimate: 'quick',
        };
      }
    });
  }

  if (byType["reading"]?.length) {
    fetches.push(async () => {
      const { data } = await supabase
        .from("reading_items")
        .select("id, title, url, project_id, one_liner, processing_status")
        .in("id", byType["reading"]);
      for (const row of data || []) {
        result[`reading:${row.id}`] = {
          title: row.title || row.url || "Untitled",
          url: row.url,
          snippet: row.one_liner || undefined,
          scoreData: {},
          hasSourceLink: !!row.project_id,
          effortEstimate: (row as any).processing_status === 'unprocessed' ? 'long' : 'medium',
        };
      }
    });
  }

  if (byType["commitment"]?.length) {
    fetches.push(async () => {
      const { data } = await supabase
        .from("commitments")
        .select("id, title, content, person_name, person_id, company_id, direction, due_at, expected_by, implied_urgency, status")
        .in("id", byType["commitment"]);

      // Batch check VIP status for people linked to commitments
      const personIds = (data || []).map(r => r.person_id).filter(Boolean) as string[];
      let vipPersonIds = new Set<string>();
      if (personIds.length > 0) {
        const { data: people } = await supabase
          .from("people")
          .select("id, is_vip")
          .in("id", personIds)
          .eq("is_vip", true);
        vipPersonIds = new Set((people || []).map(p => p.id));
      }

      for (const row of data || []) {
        const isVip = row.person_id ? vipPersonIds.has(row.person_id) : false;
        let commitEffort: EffortEstimate = 'quick';
        if (row.direction === 'owed_by_me' && (row.implied_urgency === 'asap' || row.implied_urgency === 'today')) {
          commitEffort = 'medium';
        }
        result[`commitment:${row.id}`] = {
          title: row.title || row.content || "Untitled commitment",
          snippet: row.person_name ? `${row.direction === 'owed_to_me' ? 'From' : 'To'}: ${row.person_name}` : undefined,
          scoreData: {
            direction: row.direction,
            dueAt: row.due_at,
            expectedBy: row.expected_by,
            impliedUrgency: row.implied_urgency,
            isVip,
            status: row.status,
          },
          hasSourceLink: !!row.company_id,
          effortEstimate: commitEffort,
        };
      }
    });
  }

  await Promise.all(fetches.map(fn => fn()));
  return result;
}

function computeItemScore(sourceType: string, scoreData: any): number {
  if (!scoreData) return 0.3; // default

  switch (sourceType) {
    case "email": {
      const urgency = scoreData.receivedAt
        ? computeInboxUrgencyScore(scoreData.receivedAt)
        : 0.5;
      const importance = computeInboxImportanceScore(!scoreData.isRead);
      return computePriorityScoreV1(urgency, importance);
    }
    case "task": {
      const urgency = computeTaskUrgencyScore(scoreData.scheduledFor);
      const importance = computeTaskImportanceScore(scoreData.priority);
      return computePriorityScoreV1(urgency, importance);
    }
    case "calendar_event": {
      const urgency = scoreData.startTime
        ? computeCalendarUrgencyScore(scoreData.startTime)
        : 0.5;
      const importance = computeCalendarImportanceScore();
      return computePriorityScoreV1(urgency, importance);
    }
    case "commitment": {
      const urgency = computeCommitmentUrgencyScore(
        scoreData.direction,
        scoreData.dueAt,
        scoreData.expectedBy,
        scoreData.impliedUrgency
      );
      const importance = computeCommitmentImportanceScore(
        scoreData.direction,
        scoreData.isVip,
        scoreData.impliedUrgency
      );
      return computePriorityScoreV1(urgency, importance);
    }
    case "note":
      return 0.2;
    case "reading":
      return 0.25;
    default:
      return 0.3;
  }
}
