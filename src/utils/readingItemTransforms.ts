
import { ReadingItem, ReadingItemRow } from '@/types/readingItem';

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
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: row.created_by || undefined,
    project_id: row.project_id || undefined
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
  if (itemData.projectId !== undefined) {
    dbData.project_id = itemData.projectId;
    delete dbData.projectId;
  }
  
  return dbData;
};
