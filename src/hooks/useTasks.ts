
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type TaskRow = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];

// Frontend Task type with proper typing
export interface Task {
  id: string;
  content: string;
  completed: boolean;
  project?: {
    id: string;
    name: string;
    color: string;
  };
  priority?: "low" | "medium" | "high";
  scheduledFor?: string;
  status?: "todo" | "inprogress" | "done";
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  project_id?: string;
}

// Transform database row to frontend Task type
const transformTask = (row: TaskRow & { project?: any }): Task => {
  return {
    id: row.id,
    content: row.content,
    completed: row.completed || false,
    project: row.project,
    priority: (row.priority as "low" | "medium" | "high") || undefined,
    scheduledFor: row.scheduled_for || undefined,
    status: (row.status as "todo" | "inprogress" | "done") || "todo",
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: row.created_by || undefined,
    project_id: row.project_id || undefined
  };
};

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            *,
            project:projects(id, name, color)
          `)
          .order('created_at', { ascending: false });

        if (error) {
          setError(error.message);
        } else {
          const transformedTasks = (data || []).map(transformTask);
          setTasks(transformedTasks);
        }
      } catch (err) {
        setError('Failed to fetch tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const createTask = async (taskData: Omit<TaskInsert, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...taskData,
        created_by: user.id
      })
      .select(`
        *,
        project:projects(id, name, color)
      `)
      .single();

    if (error) throw error;
    
    const transformedTask = transformTask(data);
    setTasks(prev => [transformedTask, ...prev]);
    return transformedTask;
  };

  const updateTask = async (id: string, updates: Partial<TaskRow>) => {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        project:projects(id, name, color)
      `)
      .single();

    if (error) throw error;

    const transformedTask = transformTask(data);
    setTasks(prev => prev.map(t => t.id === id ? transformedTask : t));
    return transformedTask;
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setTasks(prev => prev.filter(t => t.id !== id));
  };

  return { 
    tasks, 
    loading, 
    error, 
    createTask, 
    updateTask, 
    deleteTask 
  };
}
