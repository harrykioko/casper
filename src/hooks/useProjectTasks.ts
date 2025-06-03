
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/hooks/useTasks";
import { useToast } from "@/hooks/use-toast";

export function useProjectTasks() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Fetch project tasks
  useEffect(() => {
    if (!id) return;
    
    const fetchTasks = async () => {
      try {
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select(`
            *,
            project:projects(id, name, color),
            category:categories(id, name)
          `)
          .eq('project_id', id)
          .order('created_at', { ascending: false });

        if (tasksError) throw tasksError;

        if (tasksData) {
          const transformedTasks = tasksData.map(task => ({
            id: task.id,
            content: task.content,
            completed: task.completed || false,
            project: task.project,
            priority: task.priority as "low" | "medium" | "high" | undefined,
            category: task.category?.name,
            scheduledFor: task.scheduled_for,
            status: task.status as "todo" | "inprogress" | "done" | undefined,
            created_at: task.created_at,
            updated_at: task.updated_at,
            created_by: task.created_by,
            project_id: task.project_id,
            category_id: task.category_id,
            is_quick_task: task.is_quick_task || false
          }));
          setTasks(transformedTasks);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
        toast({
          title: "Error",
          description: "Failed to load tasks",
          variant: "destructive"
        });
      }
    };

    fetchTasks();
  }, [id, toast]);
  
  const addTask = async (content: string) => {
    if (!id) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          content,
          project_id: id,
          created_by: user.id,
          is_quick_task: false
        })
        .select(`
          *,
          project:projects(id, name, color),
          category:categories(id, name)
        `)
        .single();

      if (error) throw error;
      
      const newTask: Task = {
        id: data.id,
        content: data.content,
        completed: data.completed || false,
        project: data.project,
        priority: data.priority as "low" | "medium" | "high" | undefined,
        category: data.category?.name,
        scheduledFor: data.scheduled_for,
        status: data.status as "todo" | "inprogress" | "done" | undefined,
        created_at: data.created_at,
        updated_at: data.updated_at,
        created_by: data.created_by,
        project_id: data.project_id,
        category_id: data.category_id,
        is_quick_task: data.is_quick_task || false
      };
      
      setTasks(prev => [newTask, ...prev]);
      toast({
        title: "Success",
        description: "Task added to project"
      });
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive"
      });
    }
  };
  
  return {
    tasks,
    addTask
  };
}
