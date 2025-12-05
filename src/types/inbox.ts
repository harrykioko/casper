export interface InboxItem {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  preview: string;
  body: string;
  receivedAt: string;
  isRead: boolean;
  relatedCompanyId?: string;
  relatedCompanyName?: string;
}

export interface TaskPrefillOptions {
  content?: string;
  description?: string;
  companyId?: string;
  companyType?: 'portfolio' | 'pipeline';
  companyName?: string;
  dueDate?: Date;
}
