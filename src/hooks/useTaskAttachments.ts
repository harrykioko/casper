import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { InboxAttachment } from "./useInboxAttachments";

interface UseTaskAttachmentsReturn {
  attachments: InboxAttachment[];
  sourceInboxItemId: string | null;
  isLoading: boolean;
  error: Error | null;
  getSignedUrl: (storagePath: string) => Promise<string | null>;
}

/**
 * Hook to fetch attachments for a task via its source inbox item.
 * When a task is created from an inbox email, it stores source_inbox_item_id.
 * This hook fetches the inbox_attachments linked to that source email.
 */
export function useTaskAttachments(taskId: string | undefined): UseTaskAttachmentsReturn {
  // First, fetch the task to get its source_inbox_item_id
  const { data: taskData, isLoading: isLoadingTask } = useQuery({
    queryKey: ["task-source", taskId],
    queryFn: async () => {
      if (!taskId) return null;

      const { data, error } = await supabase
        .from("tasks")
        .select("source_inbox_item_id")
        .eq("id", taskId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!taskId,
  });

  const sourceInboxItemId = taskData?.source_inbox_item_id || null;

  // Then, fetch attachments for that inbox item
  const { data: attachments = [], isLoading: isLoadingAttachments, error } = useQuery({
    queryKey: ["task-attachments", sourceInboxItemId],
    queryFn: async () => {
      if (!sourceInboxItemId) return [];

      const { data, error } = await supabase
        .from("inbox_attachments")
        .select("*")
        .eq("inbox_item_id", sourceInboxItemId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return (data || []).map((row) => ({
        id: row.id,
        filename: row.filename,
        mimeType: row.mime_type,
        sizeBytes: row.size_bytes,
        storagePath: row.storage_path,
        createdAt: row.created_at,
      }));
    },
    enabled: !!sourceInboxItemId,
  });

  const getSignedUrl = async (storagePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from("inbox-attachments")
      .createSignedUrl(storagePath, 3600); // 1 hour expiry

    if (error) {
      console.error("Error creating signed URL:", error);
      return null;
    }

    return data?.signedUrl || null;
  };

  return {
    attachments,
    sourceInboxItemId,
    isLoading: isLoadingTask || isLoadingAttachments,
    error: error as Error | null,
    getSignedUrl,
  };
}
