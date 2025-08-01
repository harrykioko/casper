import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PipelineCompany, PipelineStats, RoundEnum, SectorEnum, PipelineStatus } from '@/types/pipeline';
import { useToast } from '@/hooks/use-toast';

export function usePipeline() {
  const [companies, setCompanies] = useState<PipelineCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCompanies();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('pipeline_companies_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pipeline_companies'
        },
        (payload) => {
          console.log('Real-time update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setCompanies(prev => [payload.new as PipelineCompany, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setCompanies(prev => prev.map(c => 
              c.id === payload.new.id ? payload.new as PipelineCompany : c
            ));
          } else if (payload.eventType === 'DELETE') {
            setCompanies(prev => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('pipeline_companies' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
        toast({
          title: "Error",
          description: "Failed to fetch pipeline companies",
          variant: "destructive",
        });
      } else {
        setCompanies((data as any) ?? []);
      }
    } catch (err) {
      setError('Failed to fetch companies');
      toast({
        title: "Error",
        description: "Failed to fetch pipeline companies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCompany = async (companyData: {
    company_name: string;
    current_round: RoundEnum;
    sector?: SectorEnum;
    raise_amount_usd?: number;
    close_date?: string;
    website?: string;
    next_steps?: string;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Optimistic update
    const tempCompany: PipelineCompany = {
      id: 'temp-' + Date.now(),
      ...companyData,
      status: 'new' as PipelineStatus,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setCompanies(prev => [tempCompany, ...prev]);

    try {
      const { data, error } = await supabase
        .from('pipeline_companies' as any)
        .insert({
          ...companyData,
          status: 'new',
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Replace temp with real data
      setCompanies(prev => prev.map(c => c.id === tempCompany.id ? (data as any) : c));
      
      toast({
        title: "Success",
        description: `${companyData.company_name} added to pipeline`,
      });

      return data;
    } catch (error: any) {
      // Remove temp company on error
      setCompanies(prev => prev.filter(c => c.id !== tempCompany.id));
      throw error;
    }
  };

  const updateCompany = async (id: string, updates: Partial<PipelineCompany>) => {
    // Optimistic update
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));

    try {
      const { data, error } = await supabase
        .from('pipeline_companies' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCompanies(prev => prev.map(c => c.id === id ? (data as any) : c));
      return data;
    } catch (error: any) {
      // Revert on error
      await fetchCompanies();
      throw error;
    }
  };

  const deleteCompany = async (id: string) => {
    // Optimistic update
    const company = companies.find(c => c.id === id);
    setCompanies(prev => prev.filter(c => c.id !== id));

    try {
      const { error } = await supabase
        .from('pipeline_companies' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${company?.company_name} removed from pipeline`,
      });
    } catch (error: any) {
      // Revert on error
      await fetchCompanies();
      throw error;
    }
  };

  const getStats = (): PipelineStats => {
    const stats = companies.reduce(
      (acc, company) => {
        acc.total++;
        acc[company.status as keyof PipelineStats] = (acc[company.status as keyof PipelineStats] as number) + 1;
        return acc;
      },
      { total: 0, active: 0, passed: 0, to_share: 0, interesting: 0, pearls: 0, new: 0 }
    );
    return stats;
  };

  return {
    companies,
    loading,
    error,
    createCompany,
    updateCompany,
    deleteCompany,
    getStats,
    refetch: fetchCompanies,
  };
}