
export interface OutlookConnection {
  id: string;
  email: string;
  display_name: string | null;
  is_active: boolean;
  token_expires_at: string;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  microsoftEventId?: string;
  title: string;
  startTime: string;
  endTime?: string;
  location?: string;
  category?: string;
  description?: string;
  attendees?: Array<{
    name: string;
    email?: string;
    avatar?: string;
  }>;
}

export interface OutlookCalendarHook {
  connection: OutlookConnection | null;
  events: CalendarEvent[];
  loading: boolean;
  syncing: boolean;
  connectOutlook: () => Promise<void>;
  handleOAuthCallback: (code: string, state: string) => Promise<void>;
  syncCalendar: () => Promise<void>;
  disconnectOutlook: () => Promise<void>;
  isConnected: boolean;
}
