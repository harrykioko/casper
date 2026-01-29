export interface InboxItem {
  id: string;
  subject: string;
  senderName: string;
  senderEmail: string;
  toEmail: string | null;
  preview: string | null;
  body: string | null;
  htmlBody: string | null;
  receivedAt: string;
  isRead: boolean;
  isResolved: boolean;
  isDeleted: boolean;
  snoozedUntil: string | null;
  relatedCompanyId?: string;
  relatedCompanyName?: string;
  createdBy: string;
  isTopPriority?: boolean;
  
  // Cleaned content (server-side processed)
  cleanedText?: string | null;
  displaySnippet?: string | null;
  displaySubject?: string | null;
  displayFromEmail?: string | null;
  displayFromName?: string | null;
  
  // Processing signals
  isForwarded?: boolean;
  hasThread?: boolean;
  hasDisclaimer?: boolean;
  hasCalendar?: boolean;
}

export interface InboxAttachment {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  createdAt: string;
}

export interface SuggestedAction {
  id: string;
  title: string;
  effortMinutes: number | null;
  effortBucket: "quick" | "medium" | "long";
  confidence: "low" | "medium" | "high";
  source: "heuristic" | "ai";
  rationale: string;
  dueHint?: string;
  category?: string;
}

export interface TaskPrefillOptions {
  content?: string;
  description?: string;
  companyId?: string;
  companyType?: 'portfolio' | 'pipeline';
  companyName?: string;
  dueDate?: Date;
  sourceInboxItemId?: string;
}

export type InboxViewFilter = 'all' | 'action' | 'waiting' | 'archived';
