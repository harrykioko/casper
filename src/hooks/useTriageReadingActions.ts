import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ProcessingStatus, ContentType, ReadingPriority, ReadLaterBucket } from "@/types/readingItem";

export function useTriageReadingActions() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["triage_queue"] });
    queryClient.invalidateQueries({ queryKey: ["work_queue"] });
    queryClient.invalidateQueries({ queryKey: ["reading_items"] });
  };

  const resolveWorkItem = async (workItemId: string) => {
    await supabase
      .from("work_items")
      .update({
        status: "trusted",
        trusted_at: new Date().toISOString(),
        reason_codes: [],
      })
      .eq("id", workItemId);
  };

  const keepAsQueued = async (readingItemId: string, workItemId: string) => {
    await supabase
      .from("reading_items")
      .update({
        processing_status: "queued",
        processed_at: new Date().toISOString(),
      })
      .eq("id", readingItemId);

    await resolveWorkItem(workItemId);
    invalidate();
    toast.success("Added to queue");
  };

  const markUpNext = async (readingItemId: string, workItemId: string, bucket?: ReadLaterBucket) => {
    await supabase
      .from("reading_items")
      .update({
        processing_status: "up_next",
        processed_at: new Date().toISOString(),
        read_later_bucket: bucket || null,
      })
      .eq("id", readingItemId);

    await resolveWorkItem(workItemId);
    invalidate();
    toast.success("Marked as Up Next");
  };

  const markSignal = async (readingItemId: string, workItemId: string) => {
    await supabase
      .from("reading_items")
      .update({
        processing_status: "signal",
        processed_at: new Date().toISOString(),
      })
      .eq("id", readingItemId);

    await resolveWorkItem(workItemId);
    invalidate();
    toast.success("Saved as signal");
  };

  const archiveFromFocus = async (readingItemId: string, workItemId: string) => {
    const now = new Date().toISOString();
    await supabase
      .from("reading_items")
      .update({
        processing_status: "archived",
        is_archived: true,
        archived_at: now,
        processed_at: now,
      })
      .eq("id", readingItemId);

    await resolveWorkItem(workItemId);
    invalidate();
    toast.success("Archived");
  };

  const updateClassification = async (
    readingItemId: string,
    updates: {
      content_type?: ContentType;
      priority?: ReadingPriority;
      read_later_bucket?: ReadLaterBucket | null;
      project_id?: string | null;
    }
  ) => {
    await supabase
      .from("reading_items")
      .update(updates)
      .eq("id", readingItemId);

    invalidate();
  };

  return {
    keepAsQueued,
    markUpNext,
    markSignal,
    archiveFromFocus,
    updateClassification,
  };
}
