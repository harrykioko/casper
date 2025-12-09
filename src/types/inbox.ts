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
}

export interface TaskPrefillOptions {
  content?: string;
  description?: string;
  companyId?: string;
  companyType?: 'portfolio' | 'pipeline';
  companyName?: string;
  dueDate?: Date;
}

export type InboxViewFilter = 'all' | 'action' | 'waiting' | 'archived';
