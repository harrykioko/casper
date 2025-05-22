
import { useState } from "react";
import { ReadingItem } from "@/components/dashboard/ReadingList";
import { mockReadingItems } from "@/data/mockData";

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

  return {
    readingItems,
    handleMarkRead,
    handleDeleteReadingItem
  };
}
