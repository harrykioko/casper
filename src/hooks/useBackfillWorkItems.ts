import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { ensureWorkItem } from "./useEnsureWorkItem";

/**
 * Backfills work_items for existing source records that don't yet have one.
 * Runs once on mount (e.g. when Focus Queue page loads).
 */
export function useBackfillWorkItems() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const hasRun = useRef(false);

  useEffect(() => {
    if (!user?.id || hasRun.current) return;
    hasRun.current = true;

    backfill(user.id).then((count) => {
      if (count > 0) {
        queryClient.invalidateQueries({ queryKey: ["work_queue"] });
        queryClient.invalidateQueries({ queryKey: ["focus_queue"] });
      }
    });
  }, [user?.id]);
}

async function backfill(userId: string): Promise<number> {
  let created = 0;

  // Get existing work_items to know what's already tracked
  const { data: existing } = await supabase
    .from("work_items")
    .select("source_type, source_id")
    .eq("created_by", userId);

  const existingKeys = new Set(
    (existing || []).map((r) => `${r.source_type}:${r.source_id}`)
  );

  console.log(`[Focus Queue Backfill] Existing work_items: ${existingKeys.size}`);

  // Backfill emails: unresolved inbox items
  const { data: emails } = await supabase
    .from("inbox_items")
    .select("id")
    .eq("is_resolved", false)
    .eq("is_deleted", false)
    .order("received_at", { ascending: false })
    .limit(100);

  if (emails) {
    for (const email of emails) {
      if (existingKeys.has(`email:${email.id}`)) continue;
      const result = await ensureWorkItem("email", email.id, userId);
      if (result?.isNew) created++;
    }
  }

  // Backfill tasks: incomplete, not archived, not linked to project or company
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, project_id, company_id, pipeline_company_id")
    .eq("created_by", userId)
    .or("completed.is.null,completed.eq.false")
    .order("created_at", { ascending: false })
    .limit(100);

  if (tasks) {
    for (const task of tasks) {
      if (existingKeys.has(`task:${task.id}`)) continue;
      // Only backfill unlinked tasks
      if (!task.project_id && !task.company_id && !task.pipeline_company_id) {
        const result = await ensureWorkItem("task", task.id, userId);
        if (result?.isNew) created++;
      }
    }
  }

  // Backfill calendar events (recent, within last 7 days)
  const { data: calendarEvents } = await supabase
    .from("calendar_events")
    .select("id, user_id")
    .eq("user_id", userId)
    .gte("start_time", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order("start_time", { ascending: false })
    .limit(50);

  if (calendarEvents) {
    for (const event of calendarEvents) {
      if (existingKeys.has(`calendar_event:${event.id}`)) continue;
      const result = await ensureWorkItem("calendar_event", event.id, userId);
      if (result?.isNew) created++;
    }
  }

  // Backfill notes: notes without project_id
  const { data: notes } = await supabase
    .from("project_notes")
    .select("id, project_id")
    .eq("created_by", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (notes) {
    for (const note of notes) {
      if (existingKeys.has(`note:${note.id}`)) continue;
      if (!note.project_id) {
        const result = await ensureWorkItem("note", note.id, userId);
        if (result?.isNew) created++;
      }
    }
  }

  // Backfill reading items without project_id
  const { data: readingItems } = await supabase
    .from("reading_items")
    .select("id, project_id")
    .eq("created_by", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (readingItems) {
    for (const item of readingItems) {
      if (existingKeys.has(`reading:${item.id}`)) continue;
      if (!item.project_id) {
        const result = await ensureWorkItem("reading", item.id, userId);
        if (result?.isNew) created++;
      }
    }
  }

  console.log(`[Focus Queue] Backfilled ${created} work items`);
  return created;
}
