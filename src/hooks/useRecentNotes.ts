import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface RecentNote {
  id: string;
  content: string;
  interaction_type: 'note' | 'call' | 'meeting' | 'email' | 'update';
  occurred_at: string;
  company_id: string;
  company_name: string;
  company_logo?: string | null;
  entity_type: 'portfolio' | 'pipeline';
}

export function useRecentNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<RecentNote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    if (!user) {
      setNotes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch portfolio company interactions
      const { data: portfolioInteractions, error: portfolioError } = await supabase
        .from('company_interactions')
        .select(`
          id,
          content,
          interaction_type,
          occurred_at,
          company_id,
          companies!inner(id, name, logo_url)
        `)
        .eq('created_by', user.id)
        .order('occurred_at', { ascending: false })
        .limit(5);

      if (portfolioError) throw portfolioError;

      // Fetch pipeline company interactions
      const { data: pipelineInteractions, error: pipelineError } = await supabase
        .from('pipeline_interactions')
        .select(`
          id,
          content,
          interaction_type,
          occurred_at,
          pipeline_company_id,
          pipeline_companies!inner(id, company_name, logo_url)
        `)
        .eq('created_by', user.id)
        .order('occurred_at', { ascending: false })
        .limit(5);

      if (pipelineError) throw pipelineError;

      // Transform and merge
      const portfolioNotes: RecentNote[] = (portfolioInteractions || []).map((interaction: any) => ({
        id: interaction.id,
        content: interaction.content,
        interaction_type: interaction.interaction_type,
        occurred_at: interaction.occurred_at,
        company_id: interaction.company_id,
        company_name: interaction.companies.name,
        company_logo: interaction.companies.logo_url,
        entity_type: 'portfolio' as const,
      }));

      const pipelineNotes: RecentNote[] = (pipelineInteractions || []).map((interaction: any) => ({
        id: interaction.id,
        content: interaction.content,
        interaction_type: interaction.interaction_type,
        occurred_at: interaction.occurred_at,
        company_id: interaction.pipeline_company_id,
        company_name: interaction.pipeline_companies.company_name,
        company_logo: interaction.pipeline_companies.logo_url,
        entity_type: 'pipeline' as const,
      }));

      // Merge and sort by date, take top 5
      const allNotes = [...portfolioNotes, ...pipelineNotes]
        .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
        .slice(0, 5);

      setNotes(allNotes);
    } catch (err) {
      console.error('Error fetching recent notes:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return { notes, loading, refetch: fetchNotes };
}
