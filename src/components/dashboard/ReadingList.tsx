
import { ExternalLink, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface ReadingItem {
  id: string;
  url: string;
  title: string;
  description?: string;
  favicon?: string;
  isRead: boolean;
}

interface ReadingListProps {
  items: ReadingItem[];
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ReadingList({ items, onMarkRead, onDelete }: ReadingListProps) {
  return (
    <div className="h-full flex flex-col">
      <h3 className="text-lg font-medium mb-3">Reading List</h3>
      {items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
          <p>No items in your reading list</p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-2 pr-4">
            {items.map((item) => (
              <div 
                key={item.id}
                className={cn(
                  "group p-3 rounded-lg hover:glassmorphic transition-all duration-200",
                  item.isRead && "opacity-60"
                )}
              >
                <div className="flex gap-3">
                  {item.favicon && (
                    <img 
                      src={item.favicon} 
                      alt=""
                      className="w-5 h-5 mt-0.5 rounded-sm object-cover flex-shrink-0"
                    />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 
                        className={cn(
                          "font-medium text-sm line-clamp-1",
                          item.isRead && "line-through"
                        )}
                      >
                        {item.title}
                      </h4>
                      
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100"
                          onClick={() => onDelete(item.id)}
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          size="icon"
                          variant="ghost"
                          asChild
                          className="h-6 w-6 rounded-full"
                        >
                          <a href={item.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                    </div>
                    
                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    )}
                    
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-1 h-auto p-0 text-xs"
                      onClick={() => onMarkRead(item.id)}
                    >
                      {item.isRead ? 'Mark as unread' : 'Mark as read'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
