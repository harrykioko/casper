
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ReadingItem, ReadingItemInsert, ReadingItemRow, ProcessingStatus } from '@/types/readingItem';
import { transformReadingItem, transformReadingItemForDatabase } from '@/utils/readingItemTransforms';
import { fetchLinkMetadata } from '@/services/linkMetadataService';
import { classifyContentType, inferSavedFrom } from '@/utils/readingContentClassifier';
import { normalizeUrl } from '@/utils/urlNormalization';
import { ensureWorkItem } from './useEnsureWorkItem';
import { toast } from 'sonner';

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

    // Normalize URL and check for duplicates
    const normalized = normalizeUrl(dbItemData.url || itemData.url);
    const { data: existing } = await supabase
      .from('reading_items')
      .select('id, title, processing_status')
      .eq('created_by', user.id)
      .eq('url', normalized)
      .maybeSingle();

    if (existing) {
      toast.warning(`Already saved: "${existing.title}"`);
      // Return the existing item transformed
      const { data: fullExisting } = await supabase
        .from('reading_items')
        .select('*')
        .eq('id', existing.id)
        .single();
      if (fullExisting) return transformReadingItem(fullExisting);
      return null;
    }

    // Classify content type and saved_from
    const hostname = dbItemData.hostname || null;
    const contentType = classifyContentType(dbItemData.url || itemData.url, hostname);
    const savedFrom = inferSavedFrom(dbItemData.url || itemData.url, hostname);

    // Determine processing status: skip Focus if project is assigned
    const hasProject = !!(dbItemData.project_id || itemData.project_id);
    const processingStatus: ProcessingStatus = hasProject ? 'queued' : 'unprocessed';

    const insertData = {
      ...dbItemData,
      url: normalized,
      created_by: user.id,
      content_type: contentType,
      saved_from: savedFrom,
      processing_status: processingStatus,
      processed_at: hasProject ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase
      .from('reading_items')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    const transformedItem = transformReadingItem(data);
    setReadingItems(prev => [transformedItem, ...prev]);

    // If unprocessed, create work item for Focus queue
    if (processingStatus === 'unprocessed') {
      ensureWorkItem('reading', data.id, user.id).catch(err => {
        console.error('Failed to create work item for reading:', err);
      });
    }

    // Background AI enrichment (non-blocking)
    supabase.functions.invoke('reading-enrich', {
      body: {
        reading_item_id: data.id,
        url: data.url,
        title: data.title,
        description: data.description,
        hostname: data.hostname,
        content_type: contentType,
      },
    }).then(({ data: enrichData }) => {
      if (enrichData) {
        // Update local state with enrichment results
        setReadingItems(prev =>
          prev.map(item =>
            item.id === data.id
              ? {
                  ...item,
                  oneLiner: enrichData.one_liner || item.oneLiner,
                  topics: enrichData.topics || item.topics,
                  actionability: enrichData.actionability || item.actionability,
                }
              : item
          )
        );
      }
    }).catch(err => {
      console.error('Failed to enrich reading item:', err);
    });

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
