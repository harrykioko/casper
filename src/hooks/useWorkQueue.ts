import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type WorkItemSourceType = 'email' | 'calendar_event' | 'task' | 'note' | 'reading' | 'commitment';
export type WorkItemStatus = 'needs_review' | 'enriched_pending' | 'trusted' | 'snoozed' | 'ignored';

export interface WorkQueueItem {
  id: string;
  created_by: string;
  source_type: WorkItemSourceType;
  source_id: string;
  status: WorkItemStatus;
  reason_codes: string[];
  priority: number;
  snooze_until: string | null;
  last_touched_at: string | null;
  reviewed_at: string | null;
  trusted_at: string | null;
  created_at: string;
  updated_at: string;
  // Denormalized source data
  source_title?: string;
  source_snippet?: string;
  // Primary entity link
  primary_link?: {
    target_type: string;
    target_id: string;
    link_reason: string | null;
  } | null;
  // Extract one-liner
  one_liner?: string | null;
}

export interface WorkQueueFilters {
  status?: WorkItemStatus | 'all';
  reason_codes?: string[];
  source_types?: WorkItemSourceType[];
}

export interface WorkQueueCounts {
  needsReview: number;
  snoozed: number;
  enrichedPending: number;
}

export function useWorkQueue(filters: WorkQueueFilters = {}) {
  const { user } = useAuth();

  const queryKey = ["work_queue", user?.id, filters];

  const { data, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id) return { items: [], counts: { needsReview: 0, snoozed: 0, enrichedPending: 0 } };

      const now = new Date().toISOString();

      // Fetch work items
      let query = supabase
        .from("work_items")
        .select("*")
        .eq("created_by", user.id);

      // Status filter
      const statusFilter = filters.status || 'all';
      if (statusFilter === 'needs_review') {
        query = query.eq("status", "needs_review");
      } else if (statusFilter === 'snoozed') {
        query = query.eq("status", "snoozed");
      } else {
        // Default: exclude trusted and ignored
        query = query.in("status", ["needs_review", "enriched_pending", "snoozed"]);
      }

      // Source type filter
      if (filters.source_types && filters.source_types.length > 0) {
        query = query.in("source_type", filters.source_types);
      }

      const { data: workItems, error } = await query.order("priority", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching work queue:", error);
        throw error;
      }

      // Filter snoozed items: only show if snooze_until <= now (unless specifically filtering for snoozed)
      let items = (workItems || []).filter(item => {
        if (item.status === 'snoozed' && statusFilter !== 'snoozed') {
          return item.snooze_until && new Date(item.snooze_until) <= new Date(now);
        }
        return true;
      });

      // Filter by reason codes if provided
      if (filters.reason_codes && filters.reason_codes.length > 0) {
        items = items.filter(item => {
          const itemReasons = item.reason_codes || [];
          return filters.reason_codes!.some(r => itemReasons.includes(r));
        });
      }

      // Fetch entity links for these items (primary links)
      const itemSourceKeys = items.map(i => `${i.source_type}:${i.source_id}`);
      let entityLinks: Record<string, { target_type: string; target_id: string; link_reason: string | null }> = {};

      if (items.length > 0) {
        const { data: links } = await supabase
          .from("entity_links")
          .select("source_type, source_id, target_type, target_id, link_reason")
          .eq("created_by", user.id);

        if (links) {
          for (const link of links) {
            const key = `${link.source_type}:${link.source_id}`;
            if (itemSourceKeys.includes(key)) {
              entityLinks[key] = {
                target_type: link.target_type,
                target_id: link.target_id,
                link_reason: link.link_reason,
              };
            }
          }
        }
      }

      // Fetch extracts (summaries) for one-liners
      let extracts: Record<string, string> = {};
      if (items.length > 0) {
        const { data: extractData } = await supabase
          .from("item_extracts")
          .select("source_type, source_id, content")
          .eq("created_by", user.id)
          .eq("extract_type", "summary");

        if (extractData) {
          for (const ext of extractData) {
            const key = `${ext.source_type}:${ext.source_id}`;
            const content = ext.content as any;
            if (content?.one_liner) {
              extracts[key] = content.one_liner;
            }
          }
        }
      }

      // Fetch source titles from respective tables
      const sourceData = await fetchSourceTitles(items, user.id);

      // Compose final items
      const composedItems: WorkQueueItem[] = items.map(item => {
        const key = `${item.source_type}:${item.source_id}`;
        const sd = sourceData[key];
        return {
          ...item,
          status: item.status as WorkItemStatus,
          source_type: item.source_type as WorkItemSourceType,
          reason_codes: item.reason_codes || [],
          source_title: sd?.title || 'Untitled',
          source_snippet: sd?.snippet || undefined,
          primary_link: entityLinks[key] || null,
          one_liner: extracts[key] || null,
        };
      });

      // Count totals for all items (unfiltered by reason)
      const allQuery = await supabase
        .from("work_items")
        .select("status", { count: 'exact' })
        .eq("created_by", user.id);

      const allItems = allQuery.data || [];
      const counts: WorkQueueCounts = {
        needsReview: allItems.filter(i => i.status === 'needs_review').length,
        snoozed: allItems.filter(i => i.status === 'snoozed').length,
        enrichedPending: allItems.filter(i => i.status === 'enriched_pending').length,
      };

      return { items: composedItems, counts };
    },
    enabled: !!user?.id,
  });

  const isSystemClear = data
    ? data.counts.needsReview === 0 && data.counts.enrichedPending === 0
    : false;

  return {
    items: data?.items || [],
    isLoading,
    counts: data?.counts || { needsReview: 0, snoozed: 0, enrichedPending: 0 },
    isSystemClear,
    refetch,
  };
}

async function fetchSourceTitles(
  items: Array<{ source_type: string; source_id: string }>,
  userId: string
): Promise<Record<string, { title: string; snippet?: string }>> {
  const result: Record<string, { title: string; snippet?: string }> = {};

  // Group by source type
  const byType: Record<string, string[]> = {};
  for (const item of items) {
    if (!byType[item.source_type]) byType[item.source_type] = [];
    byType[item.source_type].push(item.source_id);
  }

  const fetches: (() => Promise<void>)[] = [];

  if (byType['email']?.length) {
    fetches.push(async () => {
      const { data } = await supabase
        .from("inbox_items")
        .select("id, subject, snippet, display_subject, display_snippet")
        .in("id", byType['email']);
      for (const row of data || []) {
        result[`email:${row.id}`] = {
          title: row.display_subject || row.subject || 'No subject',
          snippet: row.display_snippet || row.snippet || undefined,
        };
      }
    });
  }

  if (byType['calendar_event']?.length) {
    fetches.push(async () => {
      const { data } = await supabase
        .from("calendar_events")
        .select("id, title")
        .in("id", byType['calendar_event']);
      for (const row of data || []) {
        result[`calendar_event:${row.id}`] = {
          title: row.title || 'No title',
        };
      }
    });
  }

  if (byType['task']?.length) {
    fetches.push(async () => {
      const { data } = await supabase
        .from("tasks")
        .select("id, content")
        .in("id", byType['task']);
      for (const row of data || []) {
        result[`task:${row.id}`] = {
          title: row.content || 'Untitled task',
        };
      }
    });
  }

  if (byType['note']?.length) {
    fetches.push(async () => {
      const { data } = await supabase
        .from("project_notes")
        .select("id, title, content")
        .in("id", byType['note']);
      for (const row of data || []) {
        result[`note:${row.id}`] = {
          title: row.title || 'Untitled note',
          snippet: row.content?.substring(0, 120) || undefined,
        };
      }
    });
  }

  if (byType['reading']?.length) {
    fetches.push(async () => {
      const { data } = await supabase
        .from("reading_items")
        .select("id, title, url")
        .in("id", byType['reading']);
      for (const row of data || []) {
        result[`reading:${row.id}`] = {
          title: row.title || row.url || 'Untitled',
        };
      }
    });
  }

  if (byType['commitment']?.length) {
    fetches.push(async () => {
      const { data } = await supabase
        .from("commitments")
        .select("id, title, content, person_name")
        .in("id", byType['commitment']);
      for (const row of data || []) {
        result[`commitment:${row.id}`] = {
          title: row.title || row.content || 'Untitled commitment',
          snippet: row.person_name ? `To: ${row.person_name}` : undefined,
        };
      }
    });
  }

  await Promise.all(fetches.map(fn => fn()));
  return result;
}
