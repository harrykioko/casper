import { Database } from '@/integrations/supabase/types';

export type ReadingItemRow = Database['public']['Tables']['reading_items']['Row'];
export type ReadingItemInsert = Database['public']['Tables']['reading_items']['Insert'];

// Processing status for curation workflow
export type ProcessingStatus = 'unprocessed' | 'queued' | 'up_next' | 'signal' | 'read' | 'archived';
export type ContentType = 'x_post' | 'article' | 'blog_post' | 'newsletter' | 'tool';
export type ReadingPriority = 'low' | 'normal' | 'high';
export type ReadLaterBucket = 'today' | 'this_week' | 'someday';
export type Actionability = 'none' | 'idea' | 'follow_up' | 'diligence';
export type SavedFrom = 'x' | 'email' | 'web' | 'manual' | 'other';

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
  // Curation fields
  processingStatus: ProcessingStatus;
  processedAt?: string;
  archivedAt?: string;
  contentType?: ContentType;
  priority: ReadingPriority;
  readLaterBucket?: ReadLaterBucket;
  oneLiner?: string;
  topics: string[];
  actionability: Actionability;
  savedFrom?: SavedFrom;
  entities?: any[];
}

export interface LinkMetadata {
  title: string;
  description: string | null;
  image: string | null;
  favicon: string | null;
  hostname: string;
  url: string;
}
