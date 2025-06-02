
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { OutlookConnection, CalendarEvent, OutlookCalendarHook } from '@/types/outlook';
import { fetchConnection, connectToOutlook, handleOAuthCallback as handleCallback, disconnectFromOutlook } from '@/services/outlookConnectionService';
import { fetchEvents, syncCalendar as syncCalendarEvents } from '@/services/calendarEventsService';

export function useOutlookCalendar(): OutlookCalendarHook {
  const { user } = useAuth();
  const [connection, setConnection] = useState<OutlookConnection | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (user) {
      loadConnection();
      loadEvents();
    }
  }, [user]);

  const loadConnection = async () => {
    if (!user) return;
    const connectionData = await fetchConnection(user.id);
    setConnection(connectionData);
  };

  const loadEvents = async () => {
    if (!user) return;
    const eventsData = await fetchEvents(user.id);
    setEvents(eventsData);
  };

  const connectOutlook = async () => {
    if (!user) {
      console.error('No user available for Outlook connection');
      return;
    }

    if (loading) {
      console.log('Connection already in progress, ignoring request');
      return;
    }

    setLoading(true);
    try {
      await connectToOutlook(user.id);
    } catch (error) {
      setLoading(false);
    }
    // Note: don't set loading to false here as we're redirecting
  };

  const handleOAuthCallback = async (code: string, state: string) => {
    if (!user) {
      throw new Error('No user available for OAuth callback');
    }

    setLoading(true);
    try {
      await handleCallback(user.id, code, state);
      await loadConnection();
      await syncCalendar();
    } finally {
      setLoading(false);
    }
  };

  const syncCalendar = async () => {
    if (!user || !connection) return;

    setSyncing(true);
    try {
      await syncCalendarEvents();
      await loadEvents();
    } finally {
      setSyncing(false);
    }
  };

  const disconnectOutlook = async () => {
    if (!user || !connection) return;

    setLoading(true);
    try {
      await disconnectFromOutlook(user.id, connection.id);
      setConnection(null);
      setEvents([]);
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
