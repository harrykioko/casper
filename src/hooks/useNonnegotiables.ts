
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Nonnegotiable = Database['public']['Tables']['nonnegotiables']['Row'];
type NonnegotiableInsert = Database['public']['Tables']['nonnegotiables']['Insert'];

// Transform frontend nonnegotiable data to database format
const transformNonnegotiableForDatabase = (itemData: any): any => {
  const dbData: any = { ...itemData };
  
  // Convert camelCase to snake_case
  if (itemData.projectId !== undefined) {
    dbData.project_id = itemData.projectId;
    delete dbData.projectId;
  }
  if (itemData.createdBy !== undefined) {
    dbData.created_by = itemData.createdBy;
    delete dbData.createdBy;
  }
  if (itemData.createdAt !== undefined) {
    dbData.created_at = itemData.createdAt;
    delete dbData.createdAt;
  }
  if (itemData.updatedAt !== undefined) {
    dbData.updated_at = itemData.updatedAt;
    delete dbData.updatedAt;
  }
  if (itemData.isActive !== undefined) {
    dbData.is_active = itemData.isActive;
    delete dbData.isActive;
  }
  if (itemData.customFrequency !== undefined) {
    dbData.custom_frequency = itemData.customFrequency;
    delete dbData.customFrequency;
  }
  if (itemData.reminderTime !== undefined) {
    dbData.reminder_time = itemData.reminderTime;
    delete dbData.reminderTime;
  }
  
  return dbData;
};

export function useNonnegotiables() {
  const [nonnegotiables, setNonnegotiables] = useState<Nonnegotiable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNonnegotiables = async () => {
      try {
        const { data, error } = await supabase
          .from('nonnegotiables')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          setError(error.message);
        } else {
          setNonnegotiables(data ?? []);
        }
      } catch (err) {
        setError('Failed to fetch nonnegotiables');
      } finally {
        setLoading(false);
      }
    };

    fetchNonnegotiables();
  }, []);

  const createNonnegotiable = async (itemData: Omit<NonnegotiableInsert, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Transform camelCase to snake_case
    const dbItemData = transformNonnegotiableForDatabase(itemData);

    const { data, error } = await supabase
      .from('nonnegotiables')
      .insert({
        ...dbItemData,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    
    setNonnegotiables(prev => [data, ...prev]);
    return data;
  };

  const updateNonnegotiable = async (id: string, updates: Partial<Nonnegotiable>) => {
    // Transform camelCase to snake_case for updates
    const dbUpdates = transformNonnegotiableForDatabase(updates);

    const { data, error } = await supabase
      .from('nonnegotiables')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    setNonnegotiables(prev => prev.map(item => item.id === id ? data : item));
    return data;
  };

  const deleteNonnegotiable = async (id: string) => {
    const { error } = await supabase
      .from('nonnegotiables')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setNonnegotiables(prev => prev.filter(item => item.id !== id));
  };

  return { 
    nonnegotiables, 
    loading, 
    error, 
    createNonnegotiable, 
    updateNonnegotiable, 
    deleteNonnegotiable 
  };
}
