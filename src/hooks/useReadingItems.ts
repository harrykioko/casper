
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ReadingItem, ReadingItemInsert, ReadingItemRow } from '@/types/readingItem';
import { transformReadingItem, transformReadingItemForDatabase } from '@/utils/readingItemTransforms';
import { fetchLinkMetadata } from '@/services/linkMetadataService';

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

// Re-export the fetchLinkMetadata function for backward compatibility
export { fetchLinkMetadata } from '@/services/linkMetadataService';
