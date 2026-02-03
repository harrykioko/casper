import { ReadingItem, ReadingItemRow, ProcessingStatus, ReadingPriority, Actionability, ContentType, ReadLaterBucket, SavedFrom } from '@/types/readingItem';

// Transform database row to frontend ReadingItem type
export const transformReadingItem = (row: ReadingItemRow): ReadingItem => {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    description: row.description || undefined,
    favicon: row.favicon || undefined,
    image: row.image || undefined,
    hostname: row.hostname || undefined,
    isRead: row.is_read || false,
    isFlagged: row.is_flagged || false,
    isArchived: row.is_archived || false,
    readAt: (row as any).read_at || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: row.created_by || undefined,
    project_id: row.project_id || undefined,
    // Curation fields
    processingStatus: (row.processing_status || 'unprocessed') as ProcessingStatus,
    processedAt: row.processed_at || undefined,
    archivedAt: row.archived_at || undefined,
    contentType: (row.content_type || undefined) as ContentType | undefined,
    priority: (row.priority || 'normal') as ReadingPriority,
    readLaterBucket: (row.read_later_bucket || undefined) as ReadLaterBucket | undefined,
    oneLiner: row.one_liner || undefined,
    topics: Array.isArray(row.topics) ? row.topics : [],
    actionability: (row.actionability || 'none') as Actionability,
    savedFrom: (row.saved_from || undefined) as SavedFrom | undefined,
    entities: Array.isArray(row.entities) ? row.entities : [],
  };
};

// Transform frontend ReadingItem data to database format
export const transformReadingItemForDatabase = (itemData: any): any => {
  const dbData: any = { ...itemData };

  // Convert camelCase to snake_case
  if (itemData.isRead !== undefined) {
    dbData.is_read = itemData.isRead;
    delete dbData.isRead;
  }
  if (itemData.isFlagged !== undefined) {
    dbData.is_flagged = itemData.isFlagged;
    delete dbData.isFlagged;
  }
  if (itemData.isArchived !== undefined) {
    dbData.is_archived = itemData.isArchived;
    delete dbData.isArchived;
  }
  if (itemData.projectId !== undefined) {
    dbData.project_id = itemData.projectId;
    delete dbData.projectId;
  }
  if (itemData.readAt !== undefined) {
    dbData.read_at = itemData.readAt;
    delete dbData.readAt;
  }
  if (itemData.processingStatus !== undefined) {
    dbData.processing_status = itemData.processingStatus;
    delete dbData.processingStatus;
  }
  if (itemData.processedAt !== undefined) {
    dbData.processed_at = itemData.processedAt;
    delete dbData.processedAt;
  }
  if (itemData.archivedAt !== undefined) {
    dbData.archived_at = itemData.archivedAt;
    delete dbData.archivedAt;
  }
  if (itemData.contentType !== undefined) {
    dbData.content_type = itemData.contentType;
    delete dbData.contentType;
  }
  if (itemData.readLaterBucket !== undefined) {
    dbData.read_later_bucket = itemData.readLaterBucket;
    delete dbData.readLaterBucket;
  }
  if (itemData.oneLiner !== undefined) {
    dbData.one_liner = itemData.oneLiner;
    delete dbData.oneLiner;
  }
  if (itemData.savedFrom !== undefined) {
    dbData.saved_from = itemData.savedFrom;
    delete dbData.savedFrom;
  }

  return dbData;
};
