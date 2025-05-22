
import { ExternalLink, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
      <h3 className="section-title mb-4">Reading List</h3>
      {items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center text-zinc-500 dark:text-white/60">
          <p>No items in your reading list</p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-2 pr-4">
            {items.map((item) => (
              <motion.div 
                key={item.id}
                className={cn(
                  "group p-3 rounded-lg transition-all duration-200",
                  item.isRead ? "opacity-60" : "hover:glassmorphic hover-scale"
                )}
                whileHover={{ scale: 1.02 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
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
                          "card-title text-sm line-clamp-1 text-zinc-800 dark:text-white/90",
                          item.isRead && "line-through"
                        )}
                      >
                        {item.title}
                      </h4>
                      
                      <div className="flex gap-1 flex-shrink-0">
                        <motion.div whileTap={{ scale: 0.9 }}>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-[#FF6A79]"
                            onClick={() => onDelete(item.id)}
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        </motion.div>
                        
                        <motion.div whileHover={{ scale: 1.1 }}>
                          <Button
                            size="icon"
                            variant="ghost"
                            asChild
                            className="h-6 w-6 rounded-full text-zinc-500 hover:text-[#415AFF]"
                          >
                            <a href={item.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                    
                    {item.description && (
                      <p className="text-xs text-zinc-500 dark:text-white/60 line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    )}
                    
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-1 h-auto p-0 text-xs text-[#415AFF] dark:text-[#FF6A79]"
                      onClick={() => onMarkRead(item.id)}
                    >
                      {item.isRead ? 'Mark as unread' : 'Mark as read'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
