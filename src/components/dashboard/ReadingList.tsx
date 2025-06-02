import { Check, ExternalLink, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ReadingItem } from "@/types/readingItem";

interface ReadingListProps {
  items: ReadingItem[];
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ReadingList({ items, onMarkRead, onDelete }: ReadingListProps) {
  return (
    <div className="h-full flex flex-col">
      {items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center text-zinc-500 dark:text-white/60">
          <p>Start by adding your first link</p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-3 pr-4">
            {items.map((item) => (
              <motion.div 
                key={item.id}
                className={cn(
                  "group relative rounded-xl backdrop-blur-sm transition-all duration-200 cursor-pointer",
                  "bg-white/60 dark:bg-zinc-900/40 border border-white/20 dark:border-white/10",
                  "shadow-sm hover:shadow-md hover:scale-[1.02]",
                  item.isRead ? "opacity-60" : ""
                )}
                whileHover={{ scale: 1.02 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
              >
                <div className="p-4">
                  <div className="flex gap-3">
                    {/* Image or Favicon */}
                    <div className="flex-shrink-0">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt=""
                          className="w-16 h-16 rounded-lg object-cover"
                          onError={(e) => {
                            // Fallback to favicon if main image fails
                            const img = e.target as HTMLImageElement;
                            if (item.favicon) {
                              img.src = item.favicon;
                              img.className = "w-8 h-8 rounded object-cover mt-4";
                            } else {
                              img.style.display = 'none';
                            }
                          }}
                        />
                      ) : item.favicon ? (
                        <img 
                          src={item.favicon} 
                          alt=""
                          className="w-8 h-8 rounded object-cover mt-4"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center mt-4">
                          <ExternalLink className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className={cn(
                        "font-medium text-sm line-clamp-2 text-zinc-800 dark:text-white/90 mb-1",
                        item.isRead && "line-through"
                      )}>
                        {item.title}
                      </h4>
                      
                      {item.description && (
                        <p className="text-xs text-zinc-600 dark:text-white/60 line-clamp-2 mb-2">
                          {item.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          {item.hostname || new URL(item.url).hostname}
                        </p>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <motion.div whileTap={{ scale: 0.9 }}>
                              <Button
                                size="icon"
                                variant="ghost"
                                className={`h-7 w-7 rounded-full ${item.isRead ? 'text-green-500' : 'text-zinc-500 hover:text-green-500'}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMarkRead(item.id);
                                }}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                            </motion.div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{item.isRead ? 'Mark as unread' : 'Mark as read'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <motion.div whileTap={{ scale: 0.9 }}>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-full text-zinc-500 hover:text-rose-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item.id);
                          }}
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </motion.div>
                    </div>
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
