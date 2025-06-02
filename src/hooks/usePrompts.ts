
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Prompt = Database['public']['Tables']['prompts']['Row'];
type PromptInsert = Database['public']['Tables']['prompts']['Insert'];

// Transform frontend prompt data to database format
const transformPromptForDatabase = (promptData: any): any => {
  const dbData: any = { ...promptData };
  
  // Convert camelCase to snake_case
  if (promptData.projectId !== undefined) {
    dbData.project_id = promptData.projectId;
    delete dbData.projectId;
  }
  if (promptData.createdBy !== undefined) {
    dbData.created_by = promptData.createdBy;
    delete dbData.createdBy;
  }
  if (promptData.createdAt !== undefined) {
    dbData.created_at = promptData.createdAt;
    delete dbData.createdAt;
  }
  if (promptData.updatedAt !== undefined) {
    dbData.updated_at = promptData.updatedAt;
    delete dbData.updatedAt;
  }
  
  return dbData;
};

export function usePrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const { data, error } = await supabase
          .from('prompts')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          setError(error.message);
        } else {
          setPrompts(data ?? []);
        }
      } catch (err) {
        setError('Failed to fetch prompts');
      } finally {
        setLoading(false);
      }
    };

    fetchPrompts();
  }, []);

  const createPrompt = async (promptData: Omit<PromptInsert, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Transform camelCase to snake_case
    const dbPromptData = transformPromptForDatabase(promptData);

    const { data, error } = await supabase
      .from('prompts')
      .insert({
        ...dbPromptData,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    
    setPrompts(prev => [data, ...prev]);
    return data;
  };

  const updatePrompt = async (id: string, updates: Partial<Prompt>) => {
    // Transform camelCase to snake_case for updates
    const dbUpdates = transformPromptForDatabase(updates);

    const { data, error } = await supabase
      .from('prompts')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    setPrompts(prev => prev.map(p => p.id === id ? data : p));
    return data;
  };

  const deletePrompt = async (id: string) => {
    const { error } = await supabase
      .from('prompts')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setPrompts(prev => prev.filter(p => p.id !== id));
  };

  return { 
    prompts, 
    loading, 
    error, 
    createPrompt, 
    updatePrompt, 
    deletePrompt 
  };
}
