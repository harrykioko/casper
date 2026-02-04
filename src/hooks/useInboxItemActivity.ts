/**
 * useInboxItemActivity Hook
 *
 * Fetches activity records from the inbox_activity table for a specific inbox item.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { InboxActivity, InboxActivityActionType } from '@/types/inboxActivity';

interface ActivityRecord {
  id: string;
  action: string;
  timestamp: string;
  actionType: InboxActivityActionType;
  targetId?: string;
  targetType?: string;
}

const ACTION_LABELS: Record<InboxActivityActionType, string> = {
  link_company: 'Linked company',
  create_task: 'Created task',
  create_commitment: 'Created commitment',
  create_pipeline_company: 'Added to pipeline',
  mark_complete: 'Marked complete',
  archive: 'Archived',
  snooze: 'Snoozed',
  dismiss_suggestion: 'Dismissed suggestion',
  add_note: 'Added note',
  save_attachments: 'Saved attachments',
};

export function useInboxItemActivity(inboxItemId: string) {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    if (!inboxItemId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('inbox_activity')
        .select('*')
        .eq('inbox_item_id', inboxItemId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useInboxItemActivity] Failed to fetch:', error);
        return;
      }

      const mapped: ActivityRecord[] = (data || []).map((row) => ({
        id: row.id,
        action: ACTION_LABELS[row.action_type as InboxActivityActionType] || row.action_type,
        timestamp: row.created_at,
        actionType: row.action_type as InboxActivityActionType,
        targetId: row.target_id || undefined,
        targetType: row.target_type || undefined,
      }));

      setActivities(mapped);
    } catch (err) {
      console.error('[useInboxItemActivity] Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  }, [inboxItemId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    loading,
    refetch: fetchActivities,
  };
}
