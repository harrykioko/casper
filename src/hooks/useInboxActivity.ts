/**
 * useInboxActivity Hook
 *
 * Logs actions taken on inbox items for audit trail and analytics.
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { InboxActivityInsert } from '@/types/inboxActivity';
import type { Json } from '@/integrations/supabase/types';

export function useInboxActivity() {
  const { user } = useAuth();

  const logActivity = useCallback(
    async (insert: InboxActivityInsert) => {
      if (!user?.id) return;

      const { error } = await supabase
        .from('inbox_activity')
        .insert([{
          created_by: user.id,
          inbox_item_id: insert.inboxItemId,
          action_type: insert.actionType,
          target_id: insert.targetId || null,
          target_type: insert.targetType || null,
          metadata: (insert.metadata || null) as Json,
        }]);

      if (error) {
        console.error('[InboxActivity] Failed to log activity:', error);
      }
    },
    [user?.id]
  );

  return { logActivity };
}
