
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: string;
  name: string;
  created_by?: string;
  created_at?: string;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name');

        if (error) {
          console.error('Error fetching categories:', error);
        } else {
          setCategories(data || []);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const createCategory = async (name: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('categories')
      .insert({
        name,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;

    setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    return data;
  };

  const updateCategory = async (id: string, name: string) => {
    const { data, error } = await supabase
      .from('categories')
      .update({ name })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    setCategories(prev => 
      prev.map(cat => cat.id === id ? data : cat)
         .sort((a, b) => a.name.localeCompare(b.name))
    );
    return data;
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setCategories(prev => prev.filter(cat => cat.id !== id));
  };

  const getCategoryIdByName = (categoryName: string): string | null => {
    const category = categories.find(cat => cat.name === categoryName);
    return category ? category.id : null;
  };

  return {
    categories,
    loading,
    getCategoryIdByName,
    createCategory,
    updateCategory,
    deleteCategory
  };
}
