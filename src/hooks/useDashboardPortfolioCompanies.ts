import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DashboardPortfolioCompany {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  status: 'active' | 'watching' | 'exited' | 'archived';
  last_interaction_at: string | null;
  open_task_count: number;
}

export function useDashboardPortfolioCompanies() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<DashboardPortfolioCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = useCallback(async () => {
    if (!user) {
      setCompanies([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch portfolio companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name, logo_url, website_url, status, last_interaction_at')
        .eq('kind', 'portfolio')
        .eq('created_by', user.id)
        .order('last_interaction_at', { ascending: false, nullsFirst: false })
        .limit(10);

      if (companiesError) throw companiesError;

      if (!companiesData || companiesData.length === 0) {
        setCompanies([]);
        setLoading(false);
        return;
      }

      // Fetch task counts for each company
      const companyIds = companiesData.map(c => c.id);
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('company_id')
        .in('company_id', companyIds)
        .eq('completed', false);

      if (tasksError) throw tasksError;

      // Count tasks per company
      const taskCounts: Record<string, number> = {};
      tasksData?.forEach(task => {
        if (task.company_id) {
          taskCounts[task.company_id] = (taskCounts[task.company_id] || 0) + 1;
        }
      });

      // Combine data
      const enrichedCompanies: DashboardPortfolioCompany[] = companiesData.map(company => ({
        id: company.id,
        name: company.name,
        logo_url: company.logo_url,
        website_url: company.website_url,
        status: company.status as 'active' | 'watching' | 'exited' | 'archived',
        last_interaction_at: company.last_interaction_at,
        open_task_count: taskCounts[company.id] || 0,
      }));

      setCompanies(enrichedCompanies);
    } catch (err) {
      console.error('Error fetching dashboard portfolio companies:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  return { companies, loading, error, refetch: fetchCompanies };
}
