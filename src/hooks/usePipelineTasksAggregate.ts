import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PipelineTask } from '@/lib/pipeline/pipelineAttentionHelpers';

interface TaskAggregateResult {
  tasks: PipelineTask[];
  tasksByCompany: Map<string, PipelineTask[]>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Efficiently fetch all tasks linked to pipeline companies in a single query
 * Returns a map of companyId -> tasks for O(1) lookups
 */
export function usePipelineTasksAggregate(companyIds: string[]): TaskAggregateResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ['pipeline-tasks-aggregate', companyIds.sort().join(',')],
    queryFn: async () => {
      if (companyIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('tasks')
        .select('id, pipeline_company_id, completed, scheduled_for')
        .in('pipeline_company_id', companyIds);
      
      if (error) throw error;
      return (data || []) as PipelineTask[];
    },
    enabled: companyIds.length > 0,
    staleTime: 30000, // 30 seconds
  });
  
  // Build lookup map
  const tasksByCompany = new Map<string, PipelineTask[]>();
  const tasks = data || [];
  
  for (const task of tasks) {
    if (!task.pipeline_company_id) continue;
    const existing = tasksByCompany.get(task.pipeline_company_id) || [];
    existing.push(task);
    tasksByCompany.set(task.pipeline_company_id, existing);
  }
  
  return {
    tasks,
    tasksByCompany,
    isLoading,
    error: error as Error | null,
  };
}
