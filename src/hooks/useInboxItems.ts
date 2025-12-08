import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { InboxItem } from "@/types/inbox";
import { toast } from "sonner";

interface InboxItemRow {
  id: string;
  subject: string;
  from_name: string | null;
  from_email: string;
  to_email: string | null;
  snippet: string | null;
  text_body: string | null;
  html_body: string | null;
  received_at: string;
  is_read: boolean;
  is_resolved: boolean;
  is_deleted: boolean;
  snoozed_until: string | null;
  related_company_id: string | null;
  related_company_name: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function transformRow(row: InboxItemRow): InboxItem {
  return {
    id: row.id,
    subject: row.subject,
    senderName: row.from_name || row.from_email.split("@")[0],
    senderEmail: row.from_email,
    toEmail: row.to_email,
    preview: row.snippet,
    body: row.text_body,
    htmlBody: row.html_body,
    receivedAt: row.received_at,
    isRead: row.is_read,
    isResolved: row.is_resolved,
    isDeleted: row.is_deleted,
    snoozedUntil: row.snoozed_until,
    relatedCompanyId: row.related_company_id || undefined,
    relatedCompanyName: row.related_company_name || undefined,
    createdBy: row.created_by,
  };
}

interface UseInboxItemsOptions {
  includeArchived?: boolean;
  onlyArchived?: boolean;
}

export function useInboxItems(options: UseInboxItemsOptions = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { includeArchived = false, onlyArchived = false } = options;

  const queryKey = onlyArchived 
    ? ["inbox_items_archived", user?.id]
    : ["inbox_items", user?.id];

  const { data: inboxItems = [], isLoading, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id) return [];

      const now = new Date().toISOString();
      
      let query = supabase
        .from("inbox_items")
        .select("*")
        .eq("is_resolved", false);

      // Handle archived filtering
      if (onlyArchived) {
        query = query.eq("is_deleted", true);
      } else if (!includeArchived) {
        query = query.eq("is_deleted", false);
      }

      // Only apply snooze filter for non-archived items
      if (!onlyArchived) {
        query = query.or(`snoozed_until.is.null,snoozed_until.lte.${now}`);
      }

      const { data, error } = await query.order("received_at", { ascending: false });

      if (error) {
        console.error("Error fetching inbox items:", error);
        throw error;
      }

      return (data as InboxItemRow[]).map(transformRow);
    },
    enabled: !!user?.id,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("inbox_items")
        .update({ is_read: true })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox_items"] });
    },
  });

  const markCompleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("inbox_items")
        .update({ is_resolved: true })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox_items"] });
      toast.success("Marked as complete");
    },
    onError: (error) => {
      console.error("Error marking complete:", error);
      toast.error("Failed to mark as complete");
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("inbox_items")
        .update({ is_deleted: true })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox_items"] });
      queryClient.invalidateQueries({ queryKey: ["inbox_items_archived"] });
      toast.success("Archived");
    },
    onError: (error) => {
      console.error("Error archiving:", error);
      toast.error("Failed to archive");
    },
  });

  const snoozeMutation = useMutation({
    mutationFn: async ({ id, until }: { id: string; until: Date }) => {
      const { error } = await supabase
        .from("inbox_items")
        .update({ snoozed_until: until.toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox_items"] });
      toast.success("Snoozed");
    },
    onError: (error) => {
      console.error("Error snoozing:", error);
      toast.error("Failed to snooze");
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("inbox_items")
        .update({ is_deleted: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox_items"] });
      queryClient.invalidateQueries({ queryKey: ["inbox_items_archived"] });
      toast.success("Unarchived");
    },
    onError: (error) => {
      console.error("Error unarchiving:", error);
      toast.error("Failed to unarchive");
    },
  });

  return {
    inboxItems,
    isLoading,
    refetch,
    markAsRead: (id: string) => markAsReadMutation.mutate(id),
    markComplete: (id: string) => markCompleteMutation.mutate(id),
    archive: (id: string) => archiveMutation.mutate(id),
    unarchive: (id: string) => unarchiveMutation.mutate(id),
    snooze: (id: string, until: Date) => snoozeMutation.mutate({ id, until }),
  };
}
