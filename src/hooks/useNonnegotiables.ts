
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Nonnegotiable = Database['public']['Tables']['nonnegotiables']['Row'];
type NonnegotiableInsert = Database['public']['Tables']['nonnegotiables']['Insert'];

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

    const { data, error } = await supabase
      .from('nonnegotiables')
      .insert({
        ...itemData,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    
    setNonnegotiables(prev => [data, ...prev]);
    return data;
  };

  const updateNonnegotiable = async (id: string, updates: Partial<Nonnegotiable>) => {
    const { data, error } = await supabase
      .from('nonnegotiables')
      .update(updates)
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
