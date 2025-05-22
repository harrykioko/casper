
import { useState } from "react";
import { ReadingItem } from "@/components/dashboard/ReadingList";
import { mockReadingItems } from "@/data/mockData";
import { v4 as uuidv4 } from "uuid";

export function useReadingItemsManager() {
  const [readingItems, setReadingItems] = useState<ReadingItem[]>(mockReadingItems);
  
  const handleMarkRead = (id: string) => {
    setReadingItems(items => 
      items.map(item => 
        item.id === id ? { ...item, isRead: !item.isRead } : item
      )
    );
  };
  
  const handleDeleteReadingItem = (id: string) => {
    setReadingItems(items => items.filter(item => item.id !== id));
  };

  const handleAddReadingItem = (itemData: Omit<ReadingItem, 'id'>) => {
    const newItem: ReadingItem = {
      ...itemData,
      id: uuidv4()
    };
    setReadingItems(items => [newItem, ...items]);
  };

  return {
    readingItems,
    handleMarkRead,
    handleDeleteReadingItem,
    handleAddReadingItem
  };
}
