import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PipelineTask {
  id: string;
  content: string;
  completed: boolean;
  completed_at?: string | null;
  priority?: string | null;
  status?: string | null;
  scheduled_for?: string | null;
  pipeline_company_id: string;
  project_id?: string | null;
  category_id?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function usePipelineTasks(pipelineCompanyId: string | undefined) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<PipelineTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!user || !pipelineCompanyId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('pipeline_company_id', pipelineCompanyId)
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      setTasks((data || []) as PipelineTask[]);
    } catch (err) {
      console.error('Error fetching pipeline tasks:', err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [user, pipelineCompanyId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Real-time subscription
  useEffect(() => {
    if (!user || !pipelineCompanyId) return;

    const channel = supabase
      .channel(`pipeline-tasks-${pipelineCompanyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `pipeline_company_id=eq.${pipelineCompanyId}`,
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, pipelineCompanyId, fetchTasks]);

  const createTask = async (content: string, options?: {
    priority?: string;
    scheduled_for?: string;
  }) => {
    if (!user || !pipelineCompanyId) return null;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          content,
          pipeline_company_id: pipelineCompanyId,
          created_by: user.id,
          priority: options?.priority || null,
          scheduled_for: options?.scheduled_for || null,
          completed: false,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Task created');
      return data as PipelineTask;
    } catch (err) {
      console.error('Error creating pipeline task:', err);
      toast.error('Failed to create task');
      return null;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<PipelineTask>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;
      
      await fetchTasks();
      return true;
    } catch (err) {
      console.error('Error updating pipeline task:', err);
      toast.error('Failed to update task');
      return false;
    }
  };

  const toggleComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return false;

    const completed = !task.completed;
    const updates: Partial<PipelineTask> = {
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    };

    return updateTask(taskId, updates);
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      
      await fetchTasks();
      toast.success('Task deleted');
      return true;
    } catch (err) {
      console.error('Error deleting pipeline task:', err);
      toast.error('Failed to delete task');
      return false;
    }
  };

  return {
    tasks,
    openTasks: tasks.filter(t => !t.completed),
    completedTasks: tasks.filter(t => t.completed),
    loading,
    error,
    createTask,
    updateTask,
    toggleComplete,
    deleteTask,
    refetch: fetchTasks,
  };
}
