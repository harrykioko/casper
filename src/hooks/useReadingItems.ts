
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type ReadingItemRow = Database['public']['Tables']['reading_items']['Row'];
type ReadingItemInsert = Database['public']['Tables']['reading_items']['Insert'];

// Frontend ReadingItem type
export interface ReadingItem {
  id: string;
  url: string;
  title: string;
  description?: string;
  favicon?: string;
  image?: string;
  hostname?: string;
  isRead: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  project_id?: string;
}

// Transform database row to frontend ReadingItem type
const transformReadingItem = (row: ReadingItemRow): ReadingItem => {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    description: row.description || undefined,
    favicon: row.favicon || undefined,
    image: row.image || undefined,
    hostname: row.hostname || undefined,
    isRead: row.is_read || false,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: row.created_by || undefined,
    project_id: row.project_id || undefined
  };
};

// Transform frontend ReadingItem data to database format
const transformReadingItemForDatabase = (itemData: any): any => {
  const dbData: any = { ...itemData };
  
  // Convert camelCase to snake_case
  if (itemData.isRead !== undefined) {
    dbData.is_read = itemData.isRead;
    delete dbData.isRead;
  }
  if (itemData.projectId !== undefined) {
    dbData.project_id = itemData.projectId;
    delete dbData.projectId;
  }
  
  return dbData;
};

// Function to fetch metadata from edge function
export const fetchLinkMetadata = async (url: string) => {
  try {
    console.log('Fetching metadata for:', url);
    
    const { data, error } = await supabase.functions.invoke('fetch-link-metadata', {
      body: { url }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw error;
    }

    if (!data) {
      throw new Error('No data returned from metadata service');
    }

    console.log('Metadata fetched successfully:', data);
    return data;
  } catch (error) {
    console.error('Error fetching metadata:', error);
    
    // Return fallback metadata
    try {
      const urlObj = new URL(url);
      const fallback = {
        title: urlObj.hostname,
        description: null,
        image: null,
        favicon: null,
        hostname: urlObj.hostname,
        url: url
      };
      console.log('Using fallback metadata:', fallback);
      return fallback;
    } catch {
      throw new Error('Invalid URL');
    }
  }
};

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
          const transformedItems = (data || []).map(transformReadingItem);
          setReadingItems(transformedItems);
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

    // Transform camelCase to snake_case
    const dbItemData = transformReadingItemForDatabase(itemData);

    const { data, error } = await supabase
      .from('reading_items')
      .insert({
        ...dbItemData,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    
    const transformedItem = transformReadingItem(data);
    setReadingItems(prev => [transformedItem, ...prev]);
    return transformedItem;
  };

  const updateReadingItem = async (id: string, updates: Partial<ReadingItemRow>) => {
    // Transform camelCase to snake_case for updates
    const dbUpdates = transformReadingItemForDatabase(updates);

    const { data, error } = await supabase
      .from('reading_items')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const transformedItem = transformReadingItem(data);
    setReadingItems(prev => prev.map(item => item.id === id ? transformedItem : item));
    return transformedItem;
  };

  const deleteReadingItem = async (id: string) => {
    const { error } = await supabase
      .from('reading_items')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setReadingItems(prev => prev.filter(item => item.id !== id));
  };

  // Function to update existing items with metadata
  const updateExistingItemsWithMetadata = async () => {
    const itemsNeedingMetadata = readingItems.filter(item => 
      item.title === item.url || // Title is just the URL
      item.title === item.hostname || // Title is just the hostname
      !item.description // No description
    );

    console.log(`Found ${itemsNeedingMetadata.length} items that need metadata updates`);

    for (const item of itemsNeedingMetadata) {
      try {
        console.log(`Updating metadata for item: ${item.id}`);
        const metadata = await fetchLinkMetadata(item.url);
        
        // Only update if we got better metadata
        if (metadata.title !== item.title || metadata.description || metadata.image) {
          await updateReadingItem(item.id, {
            title: metadata.title,
            description: metadata.description,
            image: metadata.image,
            favicon: metadata.favicon,
            hostname: metadata.hostname
          });
          console.log(`Updated metadata for item: ${item.id}`);
        }
      } catch (error) {
        console.error(`Failed to update metadata for item ${item.id}:`, error);
      }
    }
  };

  return { 
    readingItems, 
    loading, 
    error, 
    createReadingItem, 
    updateReadingItem, 
    deleteReadingItem,
    updateExistingItemsWithMetadata
  };
}
