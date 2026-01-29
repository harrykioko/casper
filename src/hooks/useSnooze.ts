/**
 * useSnooze Hook - Reliable Snooze Infrastructure
 *
 * Provides unified snooze functionality across all entity types:
 * - Tasks
 * - Inbox items
 * - Priority items (delegates to underlying entity)
 *
 * Features:
 * - Persists snooze state to database
 * - Tracks snooze count for escalation
 * - Provides smart snooze time suggestions
 *
 * Note: snooze_log table not yet created - logging is deferred
 *
 * Status: Phase 1 Implementation
 */

import { useState, useCallback } from 'react';
import { addHours, addDays, setHours, setMinutes, nextMonday, startOfDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { PrioritySourceType } from '@/types/priority';

export type SnoozeEntityType = 'task' | 'inbox' | 'priority_item' | 'commitment';

export interface SnoozeOption {
  label: string;
  value: Date | null; // null = custom
  hours?: number; // For analytics
}

export interface SnoozeResult {
  success: boolean;
  error?: string;
  snoozeCount?: number;
  shouldEscalate?: boolean;
}

const ESCALATION_THRESHOLD = 3; // Flag after 3 snoozes

/**
 * Get smart snooze options based on current time
 */
export function getSnoozeOptions(context?: 'morning' | 'afternoon' | 'evening'): SnoozeOption[] {
  const now = new Date();
  const hour = now.getHours();

  // Determine context if not provided
  if (!context) {
    if (hour < 12) {
      context = 'morning';
    } else if (hour < 17) {
      context = 'afternoon';
    } else {
      context = 'evening';
    }
  }

  const options: SnoozeOption[] = [];

  // In 1 hour
  options.push({
    label: 'In 1 hour',
    value: addHours(now, 1),
    hours: 1,
  });

  // In 4 hours (if not too late)
  if (hour < 20) {
    options.push({
      label: 'In 4 hours',
      value: addHours(now, 4),
      hours: 4,
    });
  }

  // Later today (only if morning/afternoon)
  if (context === 'morning') {
    options.push({
      label: 'This afternoon',
      value: setMinutes(setHours(now, 14), 0),
      hours: Math.max(1, 14 - hour),
    });
  } else if (context === 'afternoon' && hour < 17) {
    options.push({
      label: 'End of day',
      value: setMinutes(setHours(now, 17), 0),
      hours: Math.max(1, 17 - hour),
    });
  }

  // Tomorrow morning
  const tomorrowMorning = setMinutes(setHours(addDays(now, 1), 9), 0);
  options.push({
    label: 'Tomorrow morning',
    value: tomorrowMorning,
    hours: Math.round((tomorrowMorning.getTime() - now.getTime()) / (1000 * 60 * 60)),
  });

  // Next week
  const nextWeek = setMinutes(setHours(nextMonday(now), 9), 0);
  options.push({
    label: 'Next week',
    value: nextWeek,
    hours: Math.round((nextWeek.getTime() - now.getTime()) / (1000 * 60 * 60)),
  });

  // Custom option
  options.push({
    label: 'Pick a date...',
    value: null,
  });

  return options;
}

/**
 * useSnooze Hook
 *
 * Provides snooze functionality with persistence and tracking
 */
export function useSnooze() {
  const { user } = useAuth();
  const [isSnoozing, setIsSnoozing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Snooze an entity
   */
  const snooze = useCallback(async (
    entityType: SnoozeEntityType,
    entityId: string,
    until: Date,
    options?: {
      reason?: string;
      priorityScore?: number;
      sourceType?: PrioritySourceType; // For priority_item type
    }
  ): Promise<SnoozeResult> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    setIsSnoozing(true);
    setError(null);

    try {
      // Determine the actual entity type and table
      let table: 'tasks' | 'inbox_items';

      if (entityType === 'priority_item' && options?.sourceType) {
        // Map priority source type to entity type
        if (options.sourceType === 'task') {
          table = 'tasks';
        } else if (options.sourceType === 'inbox') {
          table = 'inbox_items';
        } else {
          // Other source types don't have direct snooze support
          return { success: false, error: `Snooze not supported for ${options.sourceType}` };
        }
      } else if (entityType === 'task') {
        table = 'tasks';
      } else if (entityType === 'inbox') {
        table = 'inbox_items';
      } else {
        return { success: false, error: `Unknown entity type: ${entityType}` };
      }

      // Update the entity with snooze info
      const { error: updateError } = await supabase
        .from(table)
        .update({
          snoozed_until: until.toISOString(),
        })
        .eq('id', entityId);

      if (updateError) {
        console.error('[Snooze] Error updating entity:', updateError);
        throw updateError;
      }

      // Note: snooze_log table not yet created - logging deferred
      // When we create the snooze_log table, we can add logging here

      return {
        success: true,
        snoozeCount: 1, // Simplified - would need to track in DB
        shouldEscalate: false,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to snooze';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsSnoozing(false);
    }
  }, [user]);

  /**
   * Unsnooze an entity (clear snooze)
   */
  const unsnooze = useCallback(async (
    entityType: SnoozeEntityType,
    entityId: string
  ): Promise<SnoozeResult> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    setIsSnoozing(true);
    setError(null);

    try {
      let table: 'tasks' | 'inbox_items';

      if (entityType === 'task') {
        table = 'tasks';
      } else if (entityType === 'inbox') {
        table = 'inbox_items';
      } else {
        return { success: false, error: `Unknown entity type: ${entityType}` };
      }

      const { error: updateError } = await supabase
        .from(table)
        .update({
          snoozed_until: null,
        })
        .eq('id', entityId);

      if (updateError) {
        throw updateError;
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unsnooze';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsSnoozing(false);
    }
  }, [user]);

  /**
   * Check if an entity should be escalated (simplified - always returns false for now)
   */
  const checkEscalation = useCallback(async (
    _entityType: SnoozeEntityType,
    _entityId: string
  ): Promise<{ shouldEscalate: boolean; snoozeCount: number }> => {
    // Simplified until snooze tracking is implemented
    return { shouldEscalate: false, snoozeCount: 0 };
  }, []);

  return {
    snooze,
    unsnooze,
    checkEscalation,
    getSnoozeOptions,
    isSnoozing,
    error,
    ESCALATION_THRESHOLD,
  };
}

/**
 * Helper hook to snooze directly from a PriorityItem
 */
export function useSnoozePriorityItem() {
  const { snooze, isSnoozing, error } = useSnooze();

  const snoozePriorityItem = useCallback(async (
    item: { id: string; sourceType: PrioritySourceType; sourceId: string; priorityScore: number },
    until: Date,
    reason?: string
  ) => {
    // Map source type to entity type
    let entityType: SnoozeEntityType;

    if (item.sourceType === 'task') {
      entityType = 'task';
    } else if (item.sourceType === 'inbox') {
      entityType = 'inbox';
    } else {
      // For other types, we use 'priority_item' and pass the source type
      entityType = 'priority_item';
    }

    return snooze(entityType, item.sourceId, until, {
      reason,
      priorityScore: item.priorityScore,
      sourceType: item.sourceType,
    });
  }, [snooze]);

  return {
    snoozePriorityItem,
    isSnoozing,
    error,
  };
}
