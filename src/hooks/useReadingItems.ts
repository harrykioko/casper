
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type ReadingItem = Database['public']['Tables']['reading_items']['Row'];
type ReadingItemInsert = Database['public']['Tables']['reading_items']['Insert'];

export function useReadingItems() {
  const [readingItems, setReadingItems] = useState<ReadingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReadingItems = async () => {
      try {
        const { data, error } = await supabase
          .from('reading_items')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          setError(error.message);
        } else {
          setReadingItems(data ?? []);
        }
      } catch (err) {
        setError('Failed to fetch reading items');
      } finally {
        setLoading(false);
      }
    };

    fetchReadingItems();
  }, []);

  const createReadingItem = async (itemData: Omit<ReadingItemInsert, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('reading_items')
      .insert({
        ...itemData,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    
    setReadingItems(prev => [data, ...prev]);
    return data;
  };

  const updateReadingItem = async (id: string, updates: Partial<ReadingItem>) => {
    const { data, error } = await supabase
      .from('reading_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    setReadingItems(prev => prev.map(item => item.id === id ? data : item));
    return data;
  };

  const deleteReadingItem = async (id: string) => {
    const { error } = await supabase
      .from('reading_items')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setReadingItems(prev => prev.filter(item => item.id !== id));
  };

  return { 
    readingItems, 
    loading, 
    error, 
    createReadingItem, 
    updateReadingItem, 
    deleteReadingItem 
  };
}
