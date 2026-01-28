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
 * - Logs all snooze actions for analytics
 * - Provides smart snooze time suggestions
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
      let table: string;
      let actualEntityType = entityType;

      if (entityType === 'priority_item' && options?.sourceType) {
        // Map priority source type to entity type
        if (options.sourceType === 'task') {
          table = 'tasks';
          actualEntityType = 'task';
        } else if (options.sourceType === 'inbox') {
          table = 'inbox_items';
          actualEntityType = 'inbox';
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

      // Get current snooze count
      const { data: currentData, error: fetchError } = await supabase
        .from(table)
        .select('snooze_count')
        .eq('id', entityId)
        .single();

      if (fetchError) {
        console.error('[Snooze] Error fetching current state:', fetchError);
        // Continue anyway - might be a new snooze
      }

      const currentSnoozeCount = (currentData as any)?.snooze_count || 0;
      const newSnoozeCount = currentSnoozeCount + 1;

      // Calculate snooze duration for logging
      const snoozeDurationHours = Math.round(
        (until.getTime() - Date.now()) / (1000 * 60 * 60)
      );

      // Update the entity with snooze info
      const { error: updateError } = await supabase
        .from(table)
        .update({
          snoozed_until: until.toISOString(),
          snooze_count: newSnoozeCount,
          last_snoozed_at: new Date().toISOString(),
        })
        .eq('id', entityId);

      if (updateError) {
        console.error('[Snooze] Error updating entity:', updateError);
        throw updateError;
      }

      // Log the snooze action
      const { error: logError } = await supabase
        .from('snooze_log')
        .insert({
          entity_type: actualEntityType,
          entity_id: entityId,
          snoozed_until: until.toISOString(),
          snooze_reason: options?.reason,
          snooze_duration_hours: snoozeDurationHours,
          priority_score_at_snooze: options?.priorityScore,
          created_by: user.id,
        });

      if (logError) {
        // Log error but don't fail the snooze
        console.error('[Snooze] Error logging snooze:', logError);
      }

      // Check for escalation
      const shouldEscalate = newSnoozeCount >= ESCALATION_THRESHOLD;

      if (shouldEscalate) {
        console.log(`[Snooze] Item ${entityId} has been snoozed ${newSnoozeCount} times - flagged for escalation`);
      }

      return {
        success: true,
        snoozeCount: newSnoozeCount,
        shouldEscalate,
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
      let table: string;

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
   * Get snooze history for an entity
   */
  const getSnoozeHistory = useCallback(async (
    entityType: SnoozeEntityType,
    entityId: string
  ) => {
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('snooze_log')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Snooze] Error fetching history:', error);
      return [];
    }

    return data || [];
  }, [user]);

  /**
   * Check if an entity should be escalated
   */
  const checkEscalation = useCallback(async (
    entityType: SnoozeEntityType,
    entityId: string
  ): Promise<{ shouldEscalate: boolean; snoozeCount: number }> => {
    if (!user) {
      return { shouldEscalate: false, snoozeCount: 0 };
    }

    let table: string;

    if (entityType === 'task') {
      table = 'tasks';
    } else if (entityType === 'inbox') {
      table = 'inbox_items';
    } else {
      return { shouldEscalate: false, snoozeCount: 0 };
    }

    const { data, error } = await supabase
      .from(table)
      .select('snooze_count')
      .eq('id', entityId)
      .single();

    if (error || !data) {
      return { shouldEscalate: false, snoozeCount: 0 };
    }

    const snoozeCount = (data as any).snooze_count || 0;
    return {
      shouldEscalate: snoozeCount >= ESCALATION_THRESHOLD,
      snoozeCount,
    };
  }, [user]);

  return {
    snooze,
    unsnooze,
    getSnoozeHistory,
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
