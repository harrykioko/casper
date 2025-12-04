import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Company, CompanyStatus, CompanyWithStats } from '@/types/portfolio';
import { toast } from 'sonner';

export function usePortfolioCompanies(statusFilter?: CompanyStatus | 'all') {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<CompanyWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('companies')
        .select('*')
        .eq('kind', 'portfolio')
        .order('updated_at', { ascending: false });
      
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      const { data: companiesData, error: companiesError } = await query;
      
      if (companiesError) throw companiesError;
      
      // Fetch open task counts for each company
      const companiesWithStats: CompanyWithStats[] = await Promise.all(
        (companiesData || []).map(async (company) => {
          const { count } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id)
            .eq('completed', false);
          
          return {
            ...company,
            open_task_count: count || 0,
          } as CompanyWithStats;
        })
      );
      
      setCompanies(companiesWithStats);
    } catch (err) {
      console.error('Error fetching portfolio companies:', err);
      setError('Failed to load portfolio companies');
    } finally {
      setLoading(false);
    }
  }, [user, statusFilter]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('portfolio-companies-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'companies',
          filter: `kind=eq.portfolio`,
        },
        () => {
          fetchCompanies();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchCompanies]);

  const createCompany = async (companyData: {
    name: string;
    website_url?: string;
    logo_url?: string;
    status?: CompanyStatus;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('companies')
        .insert({
          name: companyData.name,
          website_url: companyData.website_url || null,
          logo_url: companyData.logo_url || null,
          status: companyData.status || 'active',
          kind: 'portfolio',
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Company added to portfolio');
      return data as Company;
    } catch (err) {
      console.error('Error creating company:', err);
      toast.error('Failed to create company');
      return null;
    }
  };

  const updateCompany = async (
    companyId: string,
    updates: Partial<Pick<Company, 'name' | 'website_url' | 'logo_url' | 'status'>>
  ) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', companyId);

      if (error) throw error;
      
      toast.success('Company updated');
      return true;
    } catch (err) {
      console.error('Error updating company:', err);
      toast.error('Failed to update company');
      return false;
    }
  };

  const deleteCompany = async (companyId: string) => {
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);

      if (error) throw error;
      
      toast.success('Company removed from portfolio');
      return true;
    } catch (err) {
      console.error('Error deleting company:', err);
      toast.error('Failed to delete company');
      return false;
    }
  };

  return {
    companies,
    loading,
    error,
    createCompany,
    updateCompany,
    deleteCompany,
    refetch: fetchCompanies,
  };
}
