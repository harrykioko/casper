/**
 * @deprecated Use useFocusQueue instead. Starring/top-priority is replaced by Focus triage.
 *
 * useTopPriorityItems Hook
 *
 * Derived hook that filters the unified priority list to only include
 * items explicitly flagged as "Top Priority" by the user.
 * 
 * These items take precedence on the dashboard priority tile when present.
 */

import { useUnifiedPriorityV1 } from "@/hooks/useUnifiedPriorityV1";
import type { PriorityItem } from "@/types/priority";

export function useTopPriorityItems(): {
  items: PriorityItem[];
  hasTopPriority: boolean;
  loading: boolean;
} {
  const { debug, loading } = useUnifiedPriorityV1();
  
  // Get all items from debug (full list before top-8 selection)
  const allItems = debug.allItems;

  // Filter to only top priority flagged items
  const topPriority = allItems
    .filter(item => item.isTopPriority)
    .sort((a, b) => b.priorityScore - a.priorityScore);

  return {
    items: topPriority,
    hasTopPriority: topPriority.length > 0,
    loading,
  };
}
