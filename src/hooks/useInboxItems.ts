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
  related_company_type?: string | null;
  related_company_logo_url?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_top_priority?: boolean;
  // New cleaned fields
  cleaned_text?: string | null;
  display_snippet?: string | null;
  display_subject?: string | null;
  display_from_email?: string | null;
  display_from_name?: string | null;
  is_forwarded?: boolean;
  has_thread?: boolean;
  has_disclaimer?: boolean;
  has_calendar?: boolean;
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
    relatedCompanyType: row.related_company_type as 'pipeline' | 'portfolio' | undefined,
    relatedCompanyLogoUrl: row.related_company_logo_url || undefined,
    createdBy: row.created_by,
    isTopPriority: row.is_top_priority || false,
    // Cleaned content (server-side processed)
    cleanedText: row.cleaned_text,
    displaySnippet: row.display_snippet,
    displaySubject: row.display_subject,
    displayFromEmail: row.display_from_email,
    displayFromName: row.display_from_name,
    // Processing signals
    isForwarded: row.is_forwarded || false,
    hasThread: row.has_thread || false,
    hasDisclaimer: row.has_disclaimer || false,
    hasCalendar: row.has_calendar || false,
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
      queryClient.invalidateQueries({ queryKey: ["company_linked_communications"] });
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

  const markTopPriorityMutation = useMutation({
    mutationFn: async ({ id, isTop }: { id: string; isTop: boolean }) => {
      const { error } = await supabase
        .from("inbox_items")
        .update({ is_top_priority: isTop })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox_items"] });
    },
    onError: (error) => {
      console.error("Error updating top priority:", error);
      toast.error("Failed to update top priority");
    },
  });

  const linkCompanyMutation = useMutation({
    mutationFn: async ({ 
      id, 
      companyId, 
      companyName,
      companyType,
      companyLogoUrl,
    }: { 
      id: string; 
      companyId: string | null; 
      companyName: string | null;
      companyType?: 'pipeline' | 'portfolio' | null;
      companyLogoUrl?: string | null;
    }) => {
      const { error } = await supabase
        .from("inbox_items")
        .update({ 
          related_company_id: companyId,
          related_company_name: companyName,
          related_company_type: companyType || null,
          related_company_logo_url: companyLogoUrl || null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox_items"] });
      queryClient.invalidateQueries({ queryKey: ["inbox_items_archived"] });
      queryClient.invalidateQueries({ queryKey: ["company_linked_communications"] });
      toast.success("Company linked");
    },
    onError: (error) => {
      console.error("Error linking company:", error);
      toast.error("Failed to link company");
    },
  });

  const unlinkCompanyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("inbox_items")
        .update({ 
          related_company_id: null,
          related_company_name: null,
          related_company_type: null,
          related_company_logo_url: null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox_items"] });
      queryClient.invalidateQueries({ queryKey: ["inbox_items_archived"] });
      queryClient.invalidateQueries({ queryKey: ["company_linked_communications"] });
      toast.success("Company unlinked");
    },
    onError: (error) => {
      console.error("Error unlinking company:", error);
      toast.error("Failed to unlink company");
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
    markTopPriority: (id: string, isTop: boolean) => markTopPriorityMutation.mutate({ id, isTop }),
    linkCompany: (
      id: string, 
      companyId: string | null, 
      companyName: string | null,
      companyType?: 'pipeline' | 'portfolio' | null,
      companyLogoUrl?: string | null
    ) => linkCompanyMutation.mutate({ id, companyId, companyName, companyType, companyLogoUrl }),
    unlinkCompany: (id: string) => unlinkCompanyMutation.mutate(id),
  };
}
