
import { ReadingItem, ReadingList } from "./ReadingList";
import { Button } from "@/components/ui/button";

interface ReadingListSectionProps {
  readingItems: ReadingItem[];
  onMarkRead: (id: string) => void;
  onDeleteReadingItem: (id: string) => void;
}

export function ReadingListSection({ 
  readingItems, 
  onMarkRead, 
  onDeleteReadingItem 
}: ReadingListSectionProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="section-title">Reading List</h2>
        <Button 
          size="sm" 
          variant="ghost" 
          className="text-xs font-medium h-7 px-3 hover:text-[#FF6A79]"
        >
          + Add Link
        </Button>
      </div>
      <div className="max-h-[500px] overflow-auto pr-2">
        <ReadingList 
          items={readingItems.slice(0, 3)} 
          onMarkRead={onMarkRead}
          onDelete={onDeleteReadingItem}
        />
      </div>
    </div>
  );
}
