
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/hooks/useTasks";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  context: string;
}

interface Prompt {
  id: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
}

interface Link {
  id: string;
  title: string;
  url: string;
}

export function useProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [project, setProject] = useState<Project>({
    id: "",
    name: "",
    description: "",
    color: "#FF1464",
    context: ""
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  const [isCreatePromptModalOpen, setIsCreatePromptModalOpen] = useState(false);
  
  // Fetch project data
  useEffect(() => {
    if (!id) return;
    
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        
        // Fetch project details
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single();

        if (projectError) throw projectError;

        if (projectData) {
          setProject({
            id: projectData.id,
            name: projectData.name,
            description: projectData.description || "",
            color: projectData.color || "#FF1464",
            context: projectData.context || ""
          });
        }

        // Fetch project tasks
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

        // Fetch project prompts
        const { data: promptsData, error: promptsError } = await supabase
          .from('prompts')
          .select('*')
          .eq('project_id', id)
          .order('created_at', { ascending: false });

        if (promptsError) throw promptsError;

        if (promptsData) {
          const transformedPrompts = promptsData.map(prompt => ({
            id: prompt.id,
            title: prompt.title,
            description: prompt.description || "",
            content: prompt.content,
            tags: prompt.tags || []
          }));
          setPrompts(transformedPrompts);
        }

        // Fetch project reading items
        const { data: linksData, error: linksError } = await supabase
          .from('reading_items')
          .select('*')
          .eq('project_id', id)
          .order('created_at', { ascending: false });

        if (linksError) throw linksError;

        if (linksData) {
          const transformedLinks = linksData.map(item => ({
            id: item.id,
            title: item.title,
            url: item.url
          }));
          setLinks(transformedLinks);
        }

      } catch (error) {
        console.error('Error fetching project data:', error);
        toast({
          title: "Error",
          description: "Failed to load project data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [id, toast]);
  
  const openCommandModal = () => setIsCommandModalOpen(true);
  const closeCommandModal = () => setIsCommandModalOpen(false);
  
  const openCreatePromptModal = () => setIsCreatePromptModalOpen(true);
  const closeCreatePromptModal = () => setIsCreatePromptModalOpen(false);
  
  const updateProjectContext = async (newContext: string) => {
    if (!id) return;
    
    try {
      const { error } = await supabase
        .from('projects')
        .update({ context: newContext })
        .eq('id', id);

      if (error) throw error;
      
      setProject(prev => ({ ...prev, context: newContext }));
      toast({
        title: "Success",
        description: "Project context updated"
      });
    } catch (error) {
      console.error('Error updating project context:', error);
      toast({
        title: "Error",
        description: "Failed to update project context",
        variant: "destructive"
      });
    }
  };
  
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
  
  const addPrompt = async (prompt: Omit<Prompt, 'id'>) => {
    if (!id) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('prompts')
        .insert({
          title: prompt.title,
          description: prompt.description,
          content: prompt.content,
          tags: prompt.tags,
          project_id: id,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      const newPrompt: Prompt = {
        id: data.id,
        title: data.title,
        description: data.description || "",
        content: data.content,
        tags: data.tags || []
      };
      
      setPrompts(prev => [newPrompt, ...prev]);
      toast({
        title: "Success",
        description: "Prompt added to project"
      });
    } catch (error) {
      console.error('Error adding prompt:', error);
      toast({
        title: "Error",
        description: "Failed to add prompt",
        variant: "destructive"
      });
    }
  };
  
  const addLink = async (link: { title: string, url: string }) => {
    if (!id) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('reading_items')
        .insert({
          title: link.title,
          url: link.url,
          project_id: id,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      const newLink: Link = {
        id: data.id,
        title: data.title,
        url: data.url
      };
      
      setLinks(prev => [newLink, ...prev]);
      toast({
        title: "Success",
        description: "Link added to project"
      });
    } catch (error) {
      console.error('Error adding link:', error);
      toast({
        title: "Error",
        description: "Failed to add link",
        variant: "destructive"
      });
    }
  };
  
  const removeLink = async (linkId: string) => {
    try {
      const { error } = await supabase
        .from('reading_items')
        .delete()
        .eq('id', linkId);

      if (error) throw error;
      
      setLinks(prev => prev.filter(link => link.id !== linkId));
      toast({
        title: "Success",
        description: "Link removed from project"
      });
    } catch (error) {
      console.error('Error removing link:', error);
      toast({
        title: "Error",
        description: "Failed to remove link",
        variant: "destructive"
      });
    }
  };
  
  return {
    project,
    tasks,
    prompts,
    links,
    loading,
    isCommandModalOpen,
    isCreatePromptModalOpen,
    openCommandModal,
    closeCommandModal,
    openCreatePromptModal,
    closeCreatePromptModal,
    updateProjectContext,
    addTask,
    addPrompt,
    addLink,
    removeLink
  };
}
