import { Database } from '@/integrations/supabase/types';

export type ReadingItemRow = Database['public']['Tables']['reading_items']['Row'];
export type ReadingItemInsert = Database['public']['Tables']['reading_items']['Insert'];

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
  isFlagged: boolean;
  isArchived: boolean;
  readAt?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  project_id?: string;
}

export interface LinkMetadata {
  title: string;
  description: string | null;
  image: string | null;
  favicon: string | null;
  hostname: string;
  url: string;
}
