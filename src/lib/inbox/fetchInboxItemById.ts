import { supabase } from "@/integrations/supabase/client";
import type { InboxItem } from "@/types/inbox";

/**
 * Fetches a full InboxItem by ID from the database.
 * Used when opening emails from company pages where we only have partial data.
 */
export async function fetchInboxItemById(emailId: string): Promise<InboxItem | null> {
  const { data, error } = await supabase
    .from("inbox_items")
    .select("*")
    .eq("id", emailId)
    .single();

  if (error || !data) {
    console.error("Error fetching inbox item:", error);
    return null;
  }

  // Transform to InboxItem type
  return {
    id: data.id,
    subject: data.subject,
    senderName: data.from_name || data.from_email.split("@")[0],
    senderEmail: data.from_email,
    toEmail: data.to_email,
    preview: data.snippet,
    body: data.text_body,
    htmlBody: data.html_body,
    receivedAt: data.received_at,
    isRead: data.is_read,
    isResolved: data.is_resolved,
    isDeleted: data.is_deleted,
    snoozedUntil: data.snoozed_until,
    relatedCompanyId: data.related_company_id || undefined,
    relatedCompanyName: data.related_company_name || undefined,
    relatedCompanyType: data.related_company_type as 'pipeline' | 'portfolio' | undefined,
    relatedCompanyLogoUrl: data.related_company_logo_url || undefined,
    createdBy: data.created_by,
    isTopPriority: data.is_top_priority || false,
    cleanedText: data.cleaned_text,
    displaySnippet: data.display_snippet,
    displaySubject: data.display_subject,
    displayFromEmail: data.display_from_email,
    displayFromName: data.display_from_name,
    isForwarded: data.is_forwarded || false,
    hasThread: data.has_thread || false,
    hasDisclaimer: data.has_disclaimer || false,
    hasCalendar: data.has_calendar || false,
  };
}
