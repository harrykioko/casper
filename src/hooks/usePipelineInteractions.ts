import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PipelineInteraction } from '@/types/pipelineExtended';
import { InteractionType } from '@/types/portfolio';
import { toast } from 'sonner';

export function usePipelineInteractions(pipelineCompanyId: string | undefined) {
  const { user } = useAuth();
  const [interactions, setInteractions] = useState<PipelineInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInteractions = useCallback(async () => {
    if (!user || !pipelineCompanyId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('pipeline_interactions')
        .select(`
          *,
          contact:pipeline_contacts(*)
        `)
        .eq('pipeline_company_id', pipelineCompanyId)
        .order('occurred_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      setInteractions((data || []) as PipelineInteraction[]);
    } catch (err) {
      console.error('Error fetching pipeline interactions:', err);
      setError('Failed to load interactions');
    } finally {
      setLoading(false);
    }
  }, [user, pipelineCompanyId]);

  useEffect(() => {
    fetchInteractions();
  }, [fetchInteractions]);

  // Real-time subscription
  useEffect(() => {
    if (!user || !pipelineCompanyId) return;

    const channel = supabase
      .channel(`pipeline-interactions-${pipelineCompanyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pipeline_interactions',
          filter: `pipeline_company_id=eq.${pipelineCompanyId}`,
        },
        () => {
          fetchInteractions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, pipelineCompanyId, fetchInteractions]);

  const createInteraction = async (interactionData: {
    interaction_type: InteractionType;
    content: string;
    occurred_at?: string;
    contact_id?: string;
  }) => {
    if (!user || !pipelineCompanyId) return null;

    try {
      const { data, error } = await supabase
        .from('pipeline_interactions')
        .insert({
          pipeline_company_id: pipelineCompanyId,
          interaction_type: interactionData.interaction_type,
          content: interactionData.content,
          occurred_at: interactionData.occurred_at || new Date().toISOString(),
          contact_id: interactionData.contact_id || null,
          created_by: user.id,
        })
        .select(`
          *,
          contact:pipeline_contacts(*)
        `)
        .single();

      if (error) throw error;
      
      toast.success('Interaction added');
      return data as PipelineInteraction;
    } catch (err) {
      console.error('Error creating pipeline interaction:', err);
      toast.error('Failed to add interaction');
      return null;
    }
  };

  const deleteInteraction = async (interactionId: string) => {
    try {
      const { error } = await supabase
        .from('pipeline_interactions')
        .delete()
        .eq('id', interactionId);

      if (error) throw error;
      
      await fetchInteractions();
      toast.success('Interaction removed');
      return true;
    } catch (err) {
      console.error('Error deleting pipeline interaction:', err);
      toast.error('Failed to remove interaction');
      return false;
    }
  };

  return {
    interactions,
    recentInteractions: interactions.slice(0, 5),
    loading,
    error,
    createInteraction,
    deleteInteraction,
    refetch: fetchInteractions,
  };
}
