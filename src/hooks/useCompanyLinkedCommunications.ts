import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { addDays, subDays, formatDistanceToNow, format, parseISO } from 'date-fns';
import {
  attendeeEmailsMatchCompany,
  inboxItemMatchesCompany,
} from '@/lib/domainMatching';

export interface LinkedCommunication {
  id: string;
  type: 'event' | 'email';
  title: string;
  subtitle: string;
  timestamp: string;
  eventData?: {
    id: string;
    title: string;
    start_time: string;
    end_time?: string | null;
    location?: string | null;
  };
  emailData?: {
    id: string;
    subject: string;
    from_email: string;
    from_name?: string | null;
    received_at: string;
  };
}

interface CalendarEventRow {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  location: string | null;
  attendees: Array<{ email?: string; name?: string }> | null;
}

interface InboxItemRow {
  id: string;
  subject: string;
  from_email: string;
  from_name: string | null;
  to_email: string | null;
  received_at: string;
}

export function useCompanyLinkedCommunications(
  primaryDomain: string | null | undefined
) {
  const { user } = useAuth();
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventRow[]>([]);
  const [inboxItems, setInboxItems] = useState<InboxItemRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);

      const now = new Date();
      const past30Days = subDays(now, 30).toISOString();
      const future14Days = addDays(now, 14).toISOString();

      // Fetch calendar events in date range
      const { data: events } = await supabase
        .from('calendar_events')
        .select('id, title, start_time, end_time, location, attendees')
        .eq('user_id', user.id)
        .gte('start_time', past30Days)
        .lte('start_time', future14Days)
        .order('start_time', { ascending: false });

      // Fetch recent inbox items (not resolved/deleted)
      const { data: emails } = await supabase
        .from('inbox_items')
        .select('id, subject, from_email, from_name, to_email, received_at')
        .eq('created_by', user.id)
        .eq('is_resolved', false)
        .eq('is_deleted', false)
        .order('received_at', { ascending: false })
        .limit(200);

      // Parse attendees from JSON
      const parsedEvents: CalendarEventRow[] = (events || []).map(event => ({
        ...event,
        attendees: Array.isArray(event.attendees) 
          ? event.attendees as Array<{ email?: string; name?: string }>
          : null
      }));

      setCalendarEvents(parsedEvents);
      setInboxItems(emails || []);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const linkedCommunications = useMemo((): LinkedCommunication[] => {
    // If no primary domain, return empty
    if (!primaryDomain || typeof primaryDomain !== 'string' || !primaryDomain.includes('.')) {
      return [];
    }

    const communications: LinkedCommunication[] = [];

    // Filter calendar events by attendee domain match
    for (const event of calendarEvents) {
      if (attendeeEmailsMatchCompany(event.attendees, primaryDomain)) {
        const startDate = parseISO(event.start_time);
        let subtitle = format(startDate, 'MMM d, h:mm a');
        if (event.end_time) {
          const endDate = parseISO(event.end_time);
          subtitle += ` – ${format(endDate, 'h:mm a')}`;
        }

        communications.push({
          id: `event-${event.id}`,
          type: 'event',
          title: event.title,
          subtitle,
          timestamp: event.start_time,
          eventData: {
            id: event.id,
            title: event.title,
            start_time: event.start_time,
            end_time: event.end_time,
            location: event.location,
          },
        });
      }
    }

    // Filter inbox items by sender/recipient domain match
    for (const email of inboxItems) {
      if (inboxItemMatchesCompany(email.from_email, email.to_email, primaryDomain)) {
        const receivedDate = parseISO(email.received_at);
        const relativeTime = formatDistanceToNow(receivedDate, { addSuffix: true });
        const senderName = email.from_name || email.from_email;

        communications.push({
          id: `email-${email.id}`,
          type: 'email',
          title: email.subject,
          subtitle: `${senderName} · ${relativeTime}`,
          timestamp: email.received_at,
          emailData: {
            id: email.id,
            subject: email.subject,
            from_email: email.from_email,
            from_name: email.from_name,
            received_at: email.received_at,
          },
        });
      }
    }

    // Sort by timestamp descending and limit to 10
    return communications
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }, [primaryDomain, calendarEvents, inboxItems]);

  return {
    linkedCommunications,
    loading,
  };
}
