import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Plus, Globe, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddLinkDialog } from "@/components/modals/AddLinkDialog";
import { GlassPanel, GlassPanelHeader, GlassSubcard } from "@/components/ui/glass-panel";
import { ReadingItem } from "@/types/readingItem";
import { cn } from "@/lib/utils";

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
  
  // Show only 3 most recent unread items
  const displayItems = readingItems.filter(item => !item.isRead).slice(0, 3);

  return (
    <GlassPanel className="h-full">
      <GlassPanelHeader 
        title="Reading List" 
        action={
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 px-2 text-xs rounded-full bg-white/50 dark:bg-white/5 hover:bg-white/70 dark:hover:bg-white/10"
              onClick={() => setAddLinkDialogOpen(true)}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
            <Link
              to="/reading-list"
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
            >
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        }
      />
      
      <div className="space-y-3">
        {displayItems.length > 0 ? (
          displayItems.map((item) => (
            <GlassSubcard key={item.id} hoverable={false} className="group">
              <div className="flex items-start gap-3">
                {/* Favicon */}
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-border/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {item.favicon ? (
                    <img src={item.favicon} alt="" className="w-5 h-5 object-contain" />
                  ) : (
                    <Globe className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-foreground hover:text-primary line-clamp-2 transition-colors"
                  >
                    {item.title}
                  </a>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.hostname}</p>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full hover:bg-status-active/10"
                    onClick={() => onMarkRead(item.id)}
                  >
                    <Check className="w-3.5 h-3.5 text-status-active" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full hover:bg-status-danger/10"
                    onClick={() => onDeleteReadingItem(item.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-status-danger" />
                  </Button>
                </div>
              </div>
            </GlassSubcard>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
              <Globe className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No unread items.</p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-3 text-xs"
              onClick={() => setAddLinkDialogOpen(true)}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add your first link
            </Button>
          </div>
        )}
      </div>

      <AddLinkDialog 
        open={addLinkDialogOpen} 
        onOpenChange={setAddLinkDialogOpen} 
        onAddLink={onAddReadingItem}
      />
    </GlassPanel>
  );
}
