import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RoundEnum, PipelineStatus, SectorEnum } from '@/types/pipeline';

export interface DashboardPipelineCompany {
  id: string;
  company_name: string;
  current_round: RoundEnum;
  status: PipelineStatus;
  sector: SectorEnum | null;
  website: string | null;
  next_steps: string | null;
  close_date: string | null;
  is_top_of_mind: boolean;
  updated_at: string;
  last_interaction_at: string | null;
  logo_url: string | null;
  open_task_count: number;
  next_task: string | null;
}

export function useDashboardPipelineFocus() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<DashboardPipelineCompany[]>([]);
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
      
      const { data, error: fetchError } = await supabase
        .from('pipeline_companies')
        .select('*')
        .eq('is_top_of_mind', true)
        .eq('created_by', user.id)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (fetchError) throw fetchError;

      if (!data || data.length === 0) {
        setCompanies([]);
        setLoading(false);
        return;
      }

      // Fetch tasks for each company
      const companyIds = data.map(c => c.id);
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('pipeline_company_id, content, scheduled_for')
        .in('pipeline_company_id', companyIds)
        .eq('completed', false)
        .order('scheduled_for', { ascending: true, nullsFirst: false });

      if (tasksError) throw tasksError;

      // Count tasks and get earliest task per company
      const taskCounts: Record<string, number> = {};
      const nextTasks: Record<string, string> = {};
      
      tasksData?.forEach(task => {
        if (task.pipeline_company_id) {
          taskCounts[task.pipeline_company_id] = (taskCounts[task.pipeline_company_id] || 0) + 1;
          if (!nextTasks[task.pipeline_company_id]) {
            nextTasks[task.pipeline_company_id] = task.content;
          }
        }
      });

      const mappedCompanies: DashboardPipelineCompany[] = data.map(company => ({
        id: company.id,
        company_name: company.company_name,
        current_round: company.current_round as RoundEnum,
        status: company.status as PipelineStatus,
        sector: company.sector as SectorEnum | null,
        website: company.website,
        next_steps: company.next_steps,
        close_date: company.close_date,
        is_top_of_mind: company.is_top_of_mind ?? false,
        updated_at: company.updated_at || company.created_at || '',
        last_interaction_at: company.last_interaction_at,
        logo_url: company.logo_url,
        open_task_count: taskCounts[company.id] || 0,
        next_task: nextTasks[company.id] || null,
      }));

      setCompanies(mappedCompanies);
    } catch (err) {
      console.error('Error fetching pipeline focus companies:', err);
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
