/**
 * useCommitments Hook
 *
 * Manages commitments (promises made to others) with full CRUD operations,
 * filtering, snooze tracking, and delegation support.
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Commitment,
  CommitmentInsert,
  CommitmentUpdate,
  CommitmentStatus,
  transformCommitment,
  transformCommitmentForDatabase,
} from '@/types/commitment';

interface UseCommitmentsOptions {
  status?: CommitmentStatus | CommitmentStatus[];
  personId?: string;
  companyId?: string;
  companyType?: 'portfolio' | 'pipeline';
  includeOverdue?: boolean;
  includeSnoozed?: boolean;
}

interface UseCommitmentsReturn {
  commitments: Commitment[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createCommitment: (data: CommitmentInsert) => Promise<Commitment>;
  updateCommitment: (id: string, updates: CommitmentUpdate) => Promise<Commitment>;
  deleteCommitment: (id: string) => Promise<void>;
  completeCommitment: (id: string, completedVia?: string, notes?: string) => Promise<Commitment>;
  delegateCommitment: (id: string, toPersonId: string, toPersonName: string) => Promise<Commitment>;
  snoozeCommitment: (id: string, until: Date) => Promise<Commitment>;
  cancelCommitment: (id: string) => Promise<Commitment>;
  getOpenCommitments: () => Commitment[];
  getOverdueCommitments: () => Commitment[];
  getCommitmentsByPerson: (personId: string) => Commitment[];
  getCommitmentsByCompany: (companyId: string, companyType: 'portfolio' | 'pipeline') => Commitment[];
}

export function useCommitments(options: UseCommitmentsOptions = {}): UseCommitmentsReturn {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommitments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('commitments')
        .select('*')
        .order('promised_at', { ascending: false });

      // Apply status filter
      if (options.status) {
        if (Array.isArray(options.status)) {
          query = query.in('status', options.status);
        } else {
          query = query.eq('status', options.status);
        }
      }

      // Apply person filter
      if (options.personId) {
        query = query.eq('person_id', options.personId);
      }

      // Apply company filter
      if (options.companyId) {
        query = query.eq('company_id', options.companyId);
        if (options.companyType) {
          query = query.eq('company_type', options.companyType);
        }
      }

      // Filter out snoozed unless explicitly included
      if (!options.includeSnoozed) {
        query = query.or('snoozed_until.is.null,snoozed_until.lt.now()');
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      const transformedCommitments = (data || []).map(transformCommitment);
      setCommitments(transformedCommitments);
    } catch (err) {
      setError('Failed to fetch commitments');
    } finally {
      setLoading(false);
    }
  }, [options.status, options.personId, options.companyId, options.companyType, options.includeSnoozed]);

  useEffect(() => {
    fetchCommitments();
  }, [fetchCommitments]);

  const createCommitment = async (data: CommitmentInsert): Promise<Commitment> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const dbData = transformCommitmentForDatabase(data);

    const { data: created, error: createError } = await supabase
      .from('commitments')
      .insert({
        ...dbData,
        created_by: user.id,
        promised_at: dbData.promised_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) throw createError;

    const transformedCommitment = transformCommitment(created);
    setCommitments(prev => [transformedCommitment, ...prev]);
    return transformedCommitment;
  };

  const updateCommitment = async (id: string, updates: CommitmentUpdate): Promise<Commitment> => {
    const dbUpdates = transformCommitmentForDatabase(updates);

    const { data, error: updateError } = await supabase
      .from('commitments')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    const transformedCommitment = transformCommitment(data);
    setCommitments(prev => prev.map(c => c.id === id ? transformedCommitment : c));
    return transformedCommitment;
  };

  const deleteCommitment = async (id: string): Promise<void> => {
    const { error: deleteError } = await supabase
      .from('commitments')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    setCommitments(prev => prev.filter(c => c.id !== id));
  };

  const completeCommitment = async (
    id: string,
    completedVia?: string,
    notes?: string
  ): Promise<Commitment> => {
    const updates: any = {
      status: 'completed',
      completed_at: new Date().toISOString(),
    };
    if (completedVia) updates.completed_via = completedVia;
    if (notes) updates.completion_notes = notes;

    const { data, error: updateError } = await supabase
      .from('commitments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    const transformedCommitment = transformCommitment(data);
    setCommitments(prev => prev.map(c => c.id === id ? transformedCommitment : c));
    return transformedCommitment;
  };

  const delegateCommitment = async (
    id: string,
    toPersonId: string,
    toPersonName: string
  ): Promise<Commitment> => {
    const { data, error: updateError } = await supabase
      .from('commitments')
      .update({
        status: 'delegated',
        delegated_to_person_id: toPersonId,
        delegated_to_name: toPersonName,
        delegated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    const transformedCommitment = transformCommitment(data);
    setCommitments(prev => prev.map(c => c.id === id ? transformedCommitment : c));
    return transformedCommitment;
  };

  const snoozeCommitment = async (id: string, until: Date): Promise<Commitment> => {
    // Get current snooze count
    const current = commitments.find(c => c.id === id);
    const newSnoozeCount = (current?.snoozeCount || 0) + 1;

    const { data, error: updateError } = await supabase
      .from('commitments')
      .update({
        snoozed_until: until.toISOString(),
        snooze_count: newSnoozeCount,
        last_snoozed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    const transformedCommitment = transformCommitment(data);
    setCommitments(prev => prev.map(c => c.id === id ? transformedCommitment : c));
    return transformedCommitment;
  };

  const cancelCommitment = async (id: string): Promise<Commitment> => {
    const { data, error: updateError } = await supabase
      .from('commitments')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    const transformedCommitment = transformCommitment(data);
    setCommitments(prev => prev.map(c => c.id === id ? transformedCommitment : c));
    return transformedCommitment;
  };

  // Computed getters
  const getOpenCommitments = useCallback(() => {
    return commitments.filter(c => c.status === 'open');
  }, [commitments]);

  const getOverdueCommitments = useCallback(() => {
    const now = new Date();
    return commitments.filter(
      c => c.status === 'open' && c.dueAt && new Date(c.dueAt) < now
    );
  }, [commitments]);

  const getCommitmentsByPerson = useCallback((personId: string) => {
    return commitments.filter(c => c.personId === personId);
  }, [commitments]);

  const getCommitmentsByCompany = useCallback((
    companyId: string,
    companyType: 'portfolio' | 'pipeline'
  ) => {
    return commitments.filter(
      c => c.companyId === companyId && c.companyType === companyType
    );
  }, [commitments]);

  return {
    commitments,
    loading,
    error,
    refetch: fetchCommitments,
    createCommitment,
    updateCommitment,
    deleteCommitment,
    completeCommitment,
    delegateCommitment,
    snoozeCommitment,
    cancelCommitment,
    getOpenCommitments,
    getOverdueCommitments,
    getCommitmentsByPerson,
    getCommitmentsByCompany,
  };
}

/**
 * Hook to create a commitment from an interaction
 */
export function useCommitmentFromInteraction() {
  const { createCommitment } = useCommitments();

  const createFromInteraction = async (
    interactionId: string,
    interactionType: 'company' | 'pipeline',
    content: string,
    personId?: string,
    personName?: string,
    companyId?: string,
    companyType?: 'portfolio' | 'pipeline',
    companyName?: string,
    dueAt?: string
  ): Promise<Commitment> => {
    return createCommitment({
      content,
      personId,
      personName,
      companyId,
      companyType,
      companyName,
      dueAt,
      sourceType: interactionType === 'company' ? 'meeting' : 'call',
      sourceId: interactionId,
      sourceReference: `From ${interactionType} interaction`,
    });
  };

  return { createFromInteraction };
}

/**
 * Hook to get commitment stats for a person
 */
export function usePersonCommitmentStats(personId: string | undefined) {
  const [stats, setStats] = useState({
    open: 0,
    completed: 0,
    broken: 0,
    overdue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!personId) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const { data, error } = await supabase
          .from('commitments')
          .select('status, due_at')
          .eq('person_id', personId);

        if (error) throw error;

        const now = new Date();
        const newStats = {
          open: 0,
          completed: 0,
          broken: 0,
          overdue: 0,
        };

        (data || []).forEach(c => {
          if (c.status === 'open') {
            newStats.open++;
            if (c.due_at && new Date(c.due_at) < now) {
              newStats.overdue++;
            }
          } else if (c.status === 'completed') {
            newStats.completed++;
          } else if (c.status === 'broken') {
            newStats.broken++;
          }
        });

        setStats(newStats);
      } catch (err) {
        console.error('Failed to fetch commitment stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [personId]);

  return { stats, loading };
}
