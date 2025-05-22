
import { useState } from "react";
import { ReadingItem, ReadingList } from "./ReadingList";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AddLinkDialog } from "@/components/modals/AddLinkDialog";

interface ReadingListSectionProps {
  readingItems: ReadingItem[];
  onMarkRead: (id: string) => void;
  onDeleteReadingItem: (id: string) => void;
  onAddReadingItem: (item: Omit<ReadingItem, 'id'>) => void;
}

export function ReadingListSection({ 
  readingItems, 
  onMarkRead, 
  onDeleteReadingItem,
  onAddReadingItem
}: ReadingListSectionProps) {
  const [addLinkDialogOpen, setAddLinkDialogOpen] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="section-title">Reading List</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-xs font-medium h-7 px-3 hover:text-zinc-700 dark:hover:text-white hover:shadow-sm ring-1 ring-white/10"
                onClick={() => setAddLinkDialogOpen(true)}
              >
                + Add Link
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add a new link to your reading list</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="max-h-[500px] overflow-auto pr-2">
        <ReadingList 
          items={readingItems.slice(0, 3)} 
          onMarkRead={onMarkRead}
          onDelete={onDeleteReadingItem}
        />
      </div>

      <AddLinkDialog 
        open={addLinkDialogOpen} 
        onOpenChange={setAddLinkDialogOpen} 
        onAddLink={onAddReadingItem}
      />
    </div>
  );
}
