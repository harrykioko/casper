import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { HarmonicEnrichment, HarmonicCandidate, EnrichmentMode, KeyPerson } from '@/types/enrichment';
import { toast } from 'sonner';

interface EnrichOptions {
  website_domain?: string;
  linkedin_url?: string;
  query_name?: string;
}

export function usePipelineEnrichment(companyId: string | undefined) {
  const [enrichment, setEnrichment] = useState<HarmonicEnrichment | null>(null);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEnrichment = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('pipeline_company_enrichments')
        .select('*')
        .eq('pipeline_company_id', companyId)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching enrichment:', fetchError);
        setError(fetchError.message);
        return;
      }

      if (data) {
        // Type cast fields from database to match our interface
        const typedEnrichment: HarmonicEnrichment = {
          id: data.id,
          pipeline_company_id: data.pipeline_company_id,
          harmonic_company_id: data.harmonic_company_id,
          match_method: data.match_method as HarmonicEnrichment['match_method'],
          confidence: data.confidence as HarmonicEnrichment['confidence'],
          description_short: data.description_short,
          description_long: data.description_long,
          hq_city: data.hq_city,
          hq_region: data.hq_region,
          hq_country: data.hq_country,
          employee_range: data.employee_range,
          founding_year: data.founding_year,
          funding_stage: data.funding_stage,
          total_funding_usd: data.total_funding_usd ? Number(data.total_funding_usd) : null,
          last_funding_date: data.last_funding_date,
          linkedin_url: data.linkedin_url,
          twitter_url: data.twitter_url,
          key_people: (data.key_people as unknown as KeyPerson[]) || [],
          source_payload: data.source_payload as Record<string, unknown> || undefined,
          enriched_at: data.enriched_at,
          last_refreshed_at: data.last_refreshed_at,
          created_by: data.created_by,
          created_at: data.created_at,
        };
        setEnrichment(typedEnrichment);
      } else {
        setEnrichment(null);
      }
    } catch (err) {
      console.error('Error fetching enrichment:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchEnrichment();
  }, [fetchEnrichment]);

  const enrichCompany = async (
    mode: EnrichmentMode,
    options?: EnrichOptions
  ): Promise<HarmonicEnrichment | null> => {
    if (!companyId) {
      toast.error('No company ID provided');
      return null;
    }

    try {
      setEnriching(true);
      setError(null);

      const { data, error: invokeError } = await supabase.functions.invoke('harmonic-enrich-company', {
        body: {
          pipeline_company_id: companyId,
          mode,
          ...options,
        },
      });

      if (invokeError) {
        console.error('Error enriching company:', invokeError);
        toast.error(invokeError.message || 'Failed to enrich company');
        setError(invokeError.message);
        return null;
      }

      if (data?.error) {
        console.error('Enrichment error:', data.error);
        toast.error(data.error);
        setError(data.error);
        return null;
      }

      if (data?.enrichment) {
        const typedEnrichment: HarmonicEnrichment = {
          ...data.enrichment,
          key_people: (data.enrichment.key_people as KeyPerson[]) || [],
        };
        setEnrichment(typedEnrichment);
        toast.success('Company enriched successfully');
        return typedEnrichment;
      }

      return null;
    } catch (err) {
      console.error('Error enriching company:', err);
      const message = (err as Error).message || 'Failed to enrich company';
      toast.error(message);
      setError(message);
      return null;
    } finally {
      setEnriching(false);
    }
  };

  const searchCandidates = async (queryName: string): Promise<HarmonicCandidate[]> => {
    if (!companyId) {
      return [];
    }

    try {
      setEnriching(true);

      const { data, error: invokeError } = await supabase.functions.invoke('harmonic-enrich-company', {
        body: {
          pipeline_company_id: companyId,
          mode: 'search_candidates',
          query_name: queryName,
        },
      });

      if (invokeError || data?.error) {
        console.error('Error searching candidates:', invokeError || data?.error);
        return [];
      }

      return data?.candidates || [];
    } catch (err) {
      console.error('Error searching candidates:', err);
      return [];
    } finally {
      setEnriching(false);
    }
  };

  const refreshEnrichment = async (): Promise<HarmonicEnrichment | null> => {
    return enrichCompany('refresh');
  };

  return {
    enrichment,
    loading,
    enriching,
    error,
    enrichCompany,
    searchCandidates,
    refreshEnrichment,
    refetch: fetchEnrichment,
  };
}
