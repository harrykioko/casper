
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { CalendarEvent } from '@/types/outlook';
import { transformDatabaseEvent } from '@/utils/outlookUtils';

export async function fetchEvents(userId: string): Promise<CalendarEvent[]> {
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: true });

    if (error) {
      throw error;
    }

    const transformedEvents: CalendarEvent[] = data.map(transformDatabaseEvent);
    return transformedEvents;
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

export async function syncCalendar(): Promise<void> {
  try {
    const { data, error } = await supabase.functions.invoke('sync-outlook-calendar');

    if (error) {
      throw error;
    }

    toast.success(`Synced ${data.eventsCount} calendar events`);
  } catch (error) {
    console.error('Error syncing calendar:', error);
    toast.error('Failed to sync calendar');
    throw error;
  }
}
