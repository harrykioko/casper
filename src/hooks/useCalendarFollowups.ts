import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { createNote } from '@/hooks/useNotes';
import type { FollowupData, LinkedCompany } from '@/types/calendarLinking';
import type { NoteTargetType } from '@/types/notes';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  attendees?: Array<{ name: string; email?: string }>;
}

export function useCalendarFollowups() {
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [followupData, setFollowupData] = useState<FollowupData | null>(null);

  const processFollowups = useCallback(async (
    noteText: string,
    event: CalendarEvent,
    linkedCompany?: LinkedCompany | null
  ) => {
    setProcessing(true);
    setFollowupData(null);

    try {
      const { data, error } = await supabase.functions.invoke('calendar-followup-processor', {
        body: {
          note_text: noteText,
          event_title: event.title,
          event_description: event.description || '',
          attendees: event.attendees || [],
          company_name: linkedCompany?.companyName || null,
        },
      });

      if (error) throw error;

      const result: FollowupData = {
        summary: data.summary || '',
        actionItems: (data.action_items || []).map((item: any) => ({
          content: item.content,
          assignee: item.assignee || undefined,
          dueSuggestion: item.due_suggestion || undefined,
        })),
        keyTopics: data.key_topics || [],
      };

      setFollowupData(result);
      return result;
    } catch (err) {
      console.error('Error processing followups:', err);
      toast.error('Failed to process follow-up notes');
      return null;
    } finally {
      setProcessing(false);
    }
  }, []);

  const saveNote = useCallback(async (
    content: string,
    eventId: string,
    companyId?: string,
    companyType?: 'pipeline' | 'portfolio'
  ) => {
    if (!user) {
      toast.error('You must be logged in');
      return null;
    }

    // Determine primary context: company if linked, otherwise calendar_event
    const primaryTargetType: NoteTargetType = companyId ? 'company' : 'calendar_event';
    const primaryTargetId = companyId || eventId;

    const secondaryContexts = companyId
      ? [{ targetType: 'calendar_event' as NoteTargetType, targetId: eventId }]
      : [];

    return createNote({
      content,
      noteType: 'meeting_followup',
      primaryContext: {
        targetType: primaryTargetType,
        targetId: primaryTargetId,
      },
      secondaryContexts,
    });
  }, [user]);

  const createTasks = useCallback(async (
    items: Array<{ content: string; assignee?: string; dueSuggestion?: string }>,
    companyId?: string,
    companyType?: 'pipeline' | 'portfolio'
  ) => {
    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    try {
      const tasksToInsert = items.map(item => ({
        content: item.content,
        created_by: user.id,
        is_quick_task: true,
        completed: false,
        is_top_priority: false,
        ...(companyType === 'pipeline' ? { pipeline_company_id: companyId } : {}),
        ...(companyType === 'portfolio' ? { company_id: companyId } : {}),
      }));

      const { error } = await supabase
        .from('tasks')
        .insert(tasksToInsert);

      if (error) throw error;

      toast.success(`Created ${items.length} task${items.length > 1 ? 's' : ''}`);
    } catch (err) {
      console.error('Error creating tasks:', err);
      toast.error('Failed to create tasks');
    }
  }, [user]);

  return {
    processing,
    followupData,
    processFollowups,
    saveNote,
    createTasks,
    setFollowupData,
  };
}
