
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export type TaskRow = Database['public']['Tables']['tasks']['Row'];
export type TaskInsert = Database['public']['Tables']['tasks']['Insert'];

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
  category?: string;
  scheduledFor?: string;
  status?: "todo" | "inprogress" | "done";
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  project_id?: string;
  category_id?: string;
  company_id?: string;
  pipeline_company_id?: string;
  inbox?: boolean;
  snoozed_until?: string | null;
  is_top_priority?: boolean;
  source_inbox_item_id?: string | null;
  archived_at?: string | null;
  completed_at?: string | null;
}

// Transform database row to frontend Task type
const transformTask = (row: TaskRow & { project?: any; category?: any }): Task => {
  return {
    id: row.id,
    content: row.content,
    completed: row.completed || false,
    project: row.project,
    priority: (row.priority as "low" | "medium" | "high") || undefined,
    category: row.category?.name || undefined,
    scheduledFor: row.scheduled_for || undefined,
    status: (row.status as "todo" | "inprogress" | "done") || "todo",
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: row.created_by || undefined,
    project_id: row.project_id || undefined,
    category_id: row.category_id || undefined,
    company_id: row.company_id || undefined,
    pipeline_company_id: row.pipeline_company_id || undefined,
    inbox: row.is_quick_task || false,
    snoozed_until: row.snoozed_until || null,
    is_top_priority: row.is_top_priority || false,
    source_inbox_item_id: row.source_inbox_item_id || null,
    archived_at: (row as any).archived_at || null,
    completed_at: row.completed_at || null,
  };
};

// Transform frontend Task data to database format
export const transformTaskForDatabase = (taskData: any): any => {
  const dbData: any = { ...taskData };
  
  // Convert camelCase to snake_case
  if (taskData.scheduledFor !== undefined) {
    dbData.scheduled_for = taskData.scheduledFor;
    delete dbData.scheduledFor;
  }
  if (taskData.projectId !== undefined) {
    dbData.project_id = taskData.projectId;
    delete dbData.projectId;
  }
  if (taskData.inbox !== undefined) {
    dbData.is_quick_task = taskData.inbox; // Map inbox to is_quick_task for now
    delete dbData.inbox;
  }
  if (taskData.categoryId !== undefined) {
    dbData.category_id = taskData.categoryId;
    delete dbData.categoryId;
  }
  
  // Remove frontend-only fields
  delete dbData.category;
  
  return dbData;
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
            project:projects(id, name, color),
            category:categories(id, name)
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

  const getInboxTasks = () => {
    return tasks
      .filter(task => task.inbox === true && !task.completed)
      .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
  };

  const isTaskArchived = (task: Task): boolean => {
    if (task.archived_at) return true;
    if (task.completed && task.completed_at) {
      const completedDate = new Date(task.completed_at);
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      return completedDate < fourteenDaysAgo;
    }
    return false;
  };

  const getNonInboxTasks = () => {
    return tasks.filter(task => !task.inbox && !isTaskArchived(task));
  };

  const getArchivedTasks = () => {
    return tasks.filter(task => !task.inbox && isTaskArchived(task));
  };

  const archiveTask = async (id: string) => {
    const { data, error } = await supabase
      .from('tasks')
      .update({ archived_at: new Date().toISOString() } as any)
      .eq('id', id)
      .select(`
        *,
        project:projects(id, name, color),
        category:categories(id, name)
      `)
      .single();

    if (error) throw error;

    const transformedTask = transformTask(data);
    setTasks(prev => prev.map(t => t.id === id ? transformedTask : t));
    return transformedTask;
  };

  const unarchiveTask = async (id: string) => {
    const { data, error } = await supabase
      .from('tasks')
      .update({ archived_at: null } as any)
      .eq('id', id)
      .select(`
        *,
        project:projects(id, name, color),
        category:categories(id, name)
      `)
      .single();

    if (error) throw error;

    const transformedTask = transformTask(data);
    setTasks(prev => prev.map(t => t.id === id ? transformedTask : t));
    return transformedTask;
  };

  const createTask = async (taskData: Omit<TaskInsert, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Transform camelCase to snake_case
    const dbTaskData = transformTaskForDatabase(taskData);

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...dbTaskData,
        created_by: user.id
      })
      .select(`
        *,
        project:projects(id, name, color),
        category:categories(id, name)
      `)
      .single();

    if (error) throw error;
    
    const transformedTask = transformTask(data);
    setTasks(prev => [transformedTask, ...prev]);
    return transformedTask;
  };

  const updateTask = async (id: string, updates: Partial<TaskRow>) => {
    // Transform camelCase to snake_case for updates
    const dbUpdates = transformTaskForDatabase(updates);

    const { data, error } = await supabase
      .from('tasks')
      .update(dbUpdates)
      .eq('id', id)
      .select(`
        *,
        project:projects(id, name, color),
        category:categories(id, name)
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

  const snoozeTask = async (id: string, until: Date) => {
    const { data, error } = await supabase
      .from('tasks')
      .update({ snoozed_until: until.toISOString() })
      .eq('id', id)
      .select(`
        *,
        project:projects(id, name, color),
        category:categories(id, name)
      `)
      .single();

    if (error) throw error;

    const transformedTask = transformTask(data);
    setTasks(prev => prev.map(t => t.id === id ? transformedTask : t));
    return transformedTask;
  };

  const markTaskTopPriority = async (taskId: string, isTop: boolean) => {
    const { data, error } = await supabase
      .from('tasks')
      .update({ is_top_priority: isTop })
      .eq('id', taskId)
      .select(`
        *,
        project:projects(id, name, color),
        category:categories(id, name)
      `)
      .single();

    if (error) throw error;

    const transformedTask = transformTask(data);
    setTasks(prev => prev.map(t => t.id === taskId ? transformedTask : t));
    return transformedTask;
  };

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    snoozeTask,
    markTaskTopPriority,
    getInboxTasks,
    getNonInboxTasks,
    getArchivedTasks,
    archiveTask,
    unarchiveTask,
  };
}
