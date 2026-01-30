/**
 * @deprecated Use useFocusTriageActions instead. Replaced by work_items status management.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface DismissedItem {
  id: string;
  source_type: string;
  source_id: string;
  dismissed_at: string;
}

export function useDismissedPriorityItems() {
  const { user } = useAuth();
  const [dismissedItems, setDismissedItems] = useState<DismissedItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch dismissed items on mount
  useEffect(() => {
    if (!user) {
      setDismissedItems([]);
      setLoading(false);
      return;
    }

    const fetchDismissed = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('dismissed_priority_items')
        .select('id, source_type, source_id, dismissed_at')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching dismissed items:', error);
      } else {
        setDismissedItems(data || []);
      }
      setLoading(false);
    };

    fetchDismissed();
  }, [user]);

  // Create a Set for fast lookup: "sourceType-sourceId"
  const dismissedSet = useMemo(() => {
    return new Set(dismissedItems.map(item => `${item.source_type}-${item.source_id}`));
  }, [dismissedItems]);

  // Check if an item is dismissed
  const isDismissed = useCallback((sourceType: string, sourceId: string) => {
    return dismissedSet.has(`${sourceType}-${sourceId}`);
  }, [dismissedSet]);

  // Dismiss an item
  const dismissItem = useCallback(async (sourceType: string, sourceId: string) => {
    if (!user) return;

    // Optimistic update
    const key = `${sourceType}-${sourceId}`;
    if (dismissedSet.has(key)) return; // Already dismissed

    const newItem: DismissedItem = {
      id: crypto.randomUUID(),
      source_type: sourceType,
      source_id: sourceId,
      dismissed_at: new Date().toISOString(),
    };
    setDismissedItems(prev => [...prev, newItem]);

    const { error } = await supabase
      .from('dismissed_priority_items')
      .insert({
        user_id: user.id,
        source_type: sourceType,
        source_id: sourceId,
      });

    if (error) {
      console.error('Error dismissing item:', error);
      // Rollback
      setDismissedItems(prev => prev.filter(i => i.id !== newItem.id));
      toast.error('Failed to dismiss item');
    }
  }, [user, dismissedSet]);

  // Undismiss an item
  const undismissItem = useCallback(async (sourceType: string, sourceId: string) => {
    if (!user) return;

    const key = `${sourceType}-${sourceId}`;
    const existing = dismissedItems.find(
      i => i.source_type === sourceType && i.source_id === sourceId
    );
    if (!existing) return;

    // Optimistic update
    setDismissedItems(prev => prev.filter(i => i.id !== existing.id));

    const { error } = await supabase
      .from('dismissed_priority_items')
      .delete()
      .eq('user_id', user.id)
      .eq('source_type', sourceType)
      .eq('source_id', sourceId);

    if (error) {
      console.error('Error undismissing item:', error);
      // Rollback
      setDismissedItems(prev => [...prev, existing]);
      toast.error('Failed to restore item');
    }
  }, [user, dismissedItems]);

  return {
    dismissedItems,
    dismissedSet,
    loading,
    isDismissed,
    dismissItem,
    undismissItem,
  };
}
