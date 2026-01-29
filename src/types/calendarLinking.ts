export interface LinkedCompany {
  id: string;
  calendarEventId: string;
  microsoftEventId?: string | null;
  companyId: string;
  companyType: 'pipeline' | 'portfolio';
  companyName: string;
  companyLogoUrl: string | null;
  linkedBy: 'auto' | 'manual';
  confidence: number | null;
  createdBy: string;
  createdAt: string;
}

export interface CompanySuggestion {
  id: string;
  calendarEventId: string;
  microsoftEventId?: string | null;
  companyId: string;
  companyType: 'pipeline' | 'portfolio';
  companyName: string;
  matchReason: string | null;
  matchedDomain: string | null;
  matchedAttendeeEmail: string | null;
  confidence: number | null;
  status: 'pending' | 'accepted' | 'dismissed';
  createdBy: string;
  createdAt: string;
}

export interface FollowupData {
  summary: string;
  actionItems: Array<{
    content: string;
    assignee?: string;
    dueSuggestion?: string;
  }>;
  keyTopics: string[];
}

export interface PersonRecord {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  createdBy: string;
}

export interface CompanySearchResult {
  id: string;
  name: string;
  type: 'pipeline' | 'portfolio';
  primaryDomain: string | null;
  logoUrl: string | null;
}
