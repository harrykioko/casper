// This file is now deprecated - use useReadingItems.ts instead
// Keeping for backwards compatibility, will be removed soon

import { useReadingItems } from './useReadingItems';

export function useReadingItemsManager() {
  const { readingItems, createReadingItem, updateReadingItem, deleteReadingItem } = useReadingItems();
  
  const handleMarkRead = (id: string) => {
    const item = readingItems.find(item => item.id === id);
    if (item) {
      updateReadingItem(id, { is_read: !item.is_read });
    }
  };
  
  const handleDeleteReadingItem = (id: string) => {
    deleteReadingItem(id);
  };

  const handleAddReadingItem = (itemData: any) => {
    createReadingItem(itemData);
  };

  return {
    readingItems,
    handleMarkRead,
    handleDeleteReadingItem,
    handleAddReadingItem
  };
}
