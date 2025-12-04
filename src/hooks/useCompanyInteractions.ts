import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CompanyInteraction, InteractionType } from '@/types/portfolio';
import { toast } from 'sonner';

export function useCompanyInteractions(companyId: string | undefined) {
  const { user } = useAuth();
  const [interactions, setInteractions] = useState<CompanyInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInteractions = useCallback(async () => {
    if (!user || !companyId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('company_interactions')
        .select(`
          *,
          contact:company_contacts(*)
        `)
        .eq('company_id', companyId)
        .order('occurred_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      setInteractions((data || []) as CompanyInteraction[]);
    } catch (err) {
      console.error('Error fetching interactions:', err);
      setError('Failed to load interactions');
    } finally {
      setLoading(false);
    }
  }, [user, companyId]);

  useEffect(() => {
    fetchInteractions();
  }, [fetchInteractions]);

  // Real-time subscription
  useEffect(() => {
    if (!user || !companyId) return;

    const channel = supabase
      .channel(`company-interactions-${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'company_interactions',
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          fetchInteractions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, companyId, fetchInteractions]);

  const createInteraction = async (interactionData: {
    interaction_type: InteractionType;
    content: string;
    occurred_at?: string;
    contact_id?: string;
  }) => {
    if (!user || !companyId) return null;

    try {
      const { data, error } = await supabase
        .from('company_interactions')
        .insert({
          company_id: companyId,
          interaction_type: interactionData.interaction_type,
          content: interactionData.content,
          occurred_at: interactionData.occurred_at || new Date().toISOString(),
          contact_id: interactionData.contact_id || null,
          created_by: user.id,
        })
        .select(`
          *,
          contact:company_contacts(*)
        `)
        .single();

      if (error) throw error;
      
      toast.success('Interaction added');
      return data as CompanyInteraction;
    } catch (err) {
      console.error('Error creating interaction:', err);
      toast.error('Failed to add interaction');
      return null;
    }
  };

  const deleteInteraction = async (interactionId: string) => {
    try {
      const { error } = await supabase
        .from('company_interactions')
        .delete()
        .eq('id', interactionId);

      if (error) throw error;
      
      await fetchInteractions();
      toast.success('Interaction removed');
      return true;
    } catch (err) {
      console.error('Error deleting interaction:', err);
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
