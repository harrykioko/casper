
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];

// Transform frontend project data to database format
const transformProjectForDatabase = (projectData: any): any => {
  const dbData: any = { ...projectData };
  
  // Convert camelCase to snake_case
  if (projectData.projectId !== undefined) {
    dbData.project_id = projectData.projectId;
    delete dbData.projectId;
  }
  if (projectData.createdBy !== undefined) {
    dbData.created_by = projectData.createdBy;
    delete dbData.createdBy;
  }
  if (projectData.createdAt !== undefined) {
    dbData.created_at = projectData.createdAt;
    delete dbData.createdAt;
  }
  if (projectData.updatedAt !== undefined) {
    dbData.updated_at = projectData.updatedAt;
    delete dbData.updatedAt;
  }
  
  return dbData;
};

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          setError(error.message);
        } else {
          setProjects(data ?? []);
        }
      } catch (err) {
        setError('Failed to fetch projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const createProject = async (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Transform camelCase to snake_case
    const dbProjectData = transformProjectForDatabase(projectData);

    const { data, error } = await supabase
      .from('projects')
      .insert({
        ...dbProjectData,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    
    setProjects(prev => [data, ...prev]);
    return data;
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    // Transform camelCase to snake_case for updates
    const dbUpdates = transformProjectForDatabase(updates);

    const { data, error } = await supabase
      .from('projects')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    setProjects(prev => prev.map(p => p.id === id ? data : p));
    return data;
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setProjects(prev => prev.filter(p => p.id !== id));
  };

  return { 
    projects, 
    loading, 
    error, 
    createProject, 
    updateProject, 
    deleteProject 
  };
}
