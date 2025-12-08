import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PipelineCompanyDetail } from '@/types/pipelineExtended';
import { RoundEnum, SectorEnum, PipelineStatus } from '@/types/pipeline';
import { toast } from 'sonner';

export function usePipelineCompanyDetail(companyId: string | undefined) {
  const { user } = useAuth();
  const [company, setCompany] = useState<PipelineCompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompany = useCallback(async () => {
    if (!user || !companyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('pipeline_companies')
        .select('*')
        .eq('id', companyId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        const mappedCompany: PipelineCompanyDetail = {
          id: data.id,
          company_name: data.company_name,
          current_round: data.current_round as RoundEnum,
          status: data.status as PipelineStatus,
          sector: data.sector as SectorEnum | null,
          raise_amount_usd: data.raise_amount_usd,
          close_date: data.close_date,
          website: data.website,
          next_steps: data.next_steps,
          logo_url: data.logo_url,
          is_top_of_mind: data.is_top_of_mind ?? false,
          last_interaction_at: data.last_interaction_at,
          primary_domain: (data as any).primary_domain ?? null,
          created_by: data.created_by,
          created_at: data.created_at || '',
          updated_at: data.updated_at || '',
        };
        setCompany(mappedCompany);
      } else {
        setCompany(null);
      }
    } catch (err) {
      console.error('Error fetching pipeline company:', err);
      setError('Failed to load company');
    } finally {
      setLoading(false);
    }
  }, [user, companyId]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  const updateCompany = async (updates: Partial<PipelineCompanyDetail>) => {
    if (!companyId) return false;

    try {
      const { error } = await supabase
        .from('pipeline_companies')
        .update(updates)
        .eq('id', companyId);

      if (error) throw error;

      await fetchCompany();
      toast.success('Company updated');
      return true;
    } catch (err) {
      console.error('Error updating pipeline company:', err);
      toast.error('Failed to update company');
      return false;
    }
  };

  const toggleTopOfMind = async () => {
    if (!company) return false;
    return updateCompany({ is_top_of_mind: !company.is_top_of_mind });
  };

  return {
    company,
    loading,
    error,
    updateCompany,
    toggleTopOfMind,
    refetch: fetchCompany,
  };
}
