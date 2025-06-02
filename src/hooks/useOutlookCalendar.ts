
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface OutlookConnection {
  id: string;
  email: string;
  display_name: string | null;
  is_active: boolean;
  token_expires_at: string;
  created_at: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime?: string;
  location?: string;
  category?: string;
}

export function useOutlookCalendar() {
  const { user } = useAuth();
  const [connection, setConnection] = useState<OutlookConnection | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConnection();
      fetchEvents();
    }
  }, [user]);

  const fetchConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('outlook_connections')
        .select('id, email, display_name, is_active, token_expires_at, created_at')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setConnection(data);
    } catch (error) {
      console.error('Error fetching connection:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user?.id)
        .order('start_time', { ascending: true });

      if (error) {
        throw error;
      }

      const transformedEvents: CalendarEvent[] = data.map(event => ({
        id: event.id,
        title: event.title,
        startTime: event.start_time,
        endTime: event.end_time || undefined,
        location: event.location || undefined,
        category: event.category || 'personal',
      }));

      setEvents(transformedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const connectOutlook = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Make GET request without body to get authorization URL
      const { data, error } = await supabase.functions.invoke('microsoft-auth');

      if (error) {
        throw error;
      }

      if (data.authUrl) {
        // Redirect to Microsoft OAuth
        window.location.href = data.authUrl;
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (error) {
      console.error('Error connecting to Outlook:', error);
      toast.error('Failed to connect to Outlook');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthCallback = async (code: string, state: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('microsoft-auth', {
        body: { code, state, action: 'callback' },
      });

      if (error) {
        throw error;
      }

      toast.success('Successfully connected to Outlook!');
      await fetchConnection();
      await syncCalendar();
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      toast.error('Failed to complete Outlook connection');
    } finally {
      setLoading(false);
    }
  };

  const syncCalendar = async () => {
    if (!user || !connection) return;

    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-outlook-calendar');

      if (error) {
        throw error;
      }

      toast.success(`Synced ${data.eventsCount} calendar events`);
      await fetchEvents();
    } catch (error) {
      console.error('Error syncing calendar:', error);
      toast.error('Failed to sync calendar');
    } finally {
      setSyncing(false);
    }
  };

  const disconnectOutlook = async () => {
    if (!user || !connection) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('outlook_connections')
        .update({ is_active: false })
        .eq('id', connection.id);

      if (error) {
        throw error;
      }

      // Clear local events
      await supabase
        .from('calendar_events')
        .delete()
        .eq('user_id', user.id);

      setConnection(null);
      setEvents([]);
      toast.success('Disconnected from Outlook');
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Failed to disconnect from Outlook');
    } finally {
      setLoading(false);
    }
  };

  return {
    connection,
    events,
    loading,
    syncing,
    connectOutlook,
    handleOAuthCallback,
    syncCalendar,
    disconnectOutlook,
    isConnected: !!connection,
  };
}
