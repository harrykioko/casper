import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Plus, Search, ExternalLink, Trash, Check, RefreshCw, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CommandModal } from "@/components/modals/CommandModal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AddLinkDialog } from "@/components/modals/AddLinkDialog";
import { AddTaskDialog } from "@/components/modals/AddTaskDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useReadingItems } from "@/hooks/useReadingItems";
import { useProjects } from "@/hooks/useProjects";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ReadingCommandPanel } from "@/components/reading/ReadingCommandPanel";
import { ReadingFilter, applyReadingFilter } from "@/components/reading/readingHelpers";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ReadingList() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { readingItems, loading, createReadingItem, updateReadingItem, deleteReadingItem, updateExistingItemsWithMetadata } = useReadingItems();
  const { projects } = useProjects();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  const [addLinkDialogOpen, setAddLinkDialogOpen] = useState(false);
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
  const [taskPrefill, setTaskPrefill] = useState<{ content: string; description?: string } | null>(null);
  const [updatingMetadata, setUpdatingMetadata] = useState(false);
  
  // Filter state
  const [filter, setFilter] = useState<ReadingFilter>({
    primaryView: 'queue',
    projects: [],
  });
  
  // Apply filters using the helper function
  const filteredItems = useMemo(
    () => applyReadingFilter(readingItems, filter, searchQuery),
    [readingItems, filter, searchQuery]
  );
  
  // Handle marking item as read/unread
  const handleMarkRead = async (id: string) => {
    const item = readingItems.find(item => item.id === id);
    if (item) {
      try {
        await updateReadingItem(id, { is_read: !item.isRead });
        toast.success(item.isRead ? 'Marked as unread' : 'Marked as read');
      } catch (error) {
        console.error('Failed to update reading item:', error);
        toast.error('Failed to update item');
      }
    }
  };

  // Handle flagging item
  const handleFlag = async (id: string) => {
    const item = readingItems.find(item => item.id === id);
    if (item) {
      try {
        await updateReadingItem(id, { is_flagged: !item.isFlagged });
        toast.success(item.isFlagged ? 'Removed flag' : 'Flagged for priority');
      } catch (error) {
        console.error('Failed to flag reading item:', error);
        toast.error('Failed to flag item');
      }
    }
  };

  // Handle archiving item
  const handleArchive = async (id: string) => {
    try {
      await updateReadingItem(id, { is_archived: true });
      toast.success('Archived');
    } catch (error) {
      console.error('Failed to archive reading item:', error);
      toast.error('Failed to archive item');
    }
  };
  
  // Handle deleting item
  const handleDelete = async (id: string) => {
    try {
      await deleteReadingItem(id);
      toast.success('Deleted');
    } catch (error) {
      console.error('Failed to delete reading item:', error);
      toast.error('Failed to delete item');
    }
  };

  // Handle adding a new link
  const handleAddLink = async (linkData: any) => {
    try {
      await createReadingItem(linkData);
      setAddLinkDialogOpen(false);
      toast.success('Link saved');
    } catch (error) {
      console.error('Failed to create reading item:', error);
      toast.error('Failed to save link');
    }
  };

  // Handle updating metadata for existing items
  const handleUpdateMetadata = async () => {
    setUpdatingMetadata(true);
    try {
      await updateExistingItemsWithMetadata();
      toast.success("Updated metadata for existing items");
    } catch (error) {
      console.error('Failed to update metadata:', error);
      toast.error("Failed to update metadata");
    } finally {
      setUpdatingMetadata(false);
    }
  };

  // Handle quick actions from command panel
  const handleQuickAction = async (itemId: string, action: 'open' | 'markRead' | 'flag' | 'archive' | 'task') => {
    const item = readingItems.find(i => i.id === itemId);
    if (!item) return;

    switch (action) {
      case 'open':
        window.open(item.url, '_blank', 'noopener,noreferrer');
        break;
      case 'markRead':
        await handleMarkRead(itemId);
        break;
      case 'flag':
        await handleFlag(itemId);
        break;
      case 'archive':
        await handleArchive(itemId);
        break;
      case 'task':
        setTaskPrefill({
          content: `[Read] ${item.title}`,
          description: item.url,
        });
        setAddTaskDialogOpen(true);
        break;
    }
  };
  
  // Command modal handling
  const openCommandModal = () => setIsCommandModalOpen(true);
  const closeCommandModal = () => setIsCommandModalOpen(false);
  
  // Handle keyboard shortcut for command modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      openCommandModal();
    }
  };

  const availableProjects = useMemo(() => 
    projects.map(p => ({ id: p.id, name: p.name })),
    [projects]
  );

  if (loading) {
    return (
      <div className="p-8 pl-24 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-9 w-40" />
            <div className="flex gap-3">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-16" />
            </div>
          </div>
          <Skeleton className="h-10 w-full mb-6" />
          <div className="grid grid-cols-[280px_1fr] gap-6">
            <Skeleton className="h-[500px] w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="p-8 pl-24 min-h-screen"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Reading List</h1>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={handleUpdateMetadata}
              disabled={updatingMetadata}
            >
              <RefreshCw className={cn("h-4 w-4", updatingMetadata && "animate-spin")} />
              <span className="hidden sm:inline">Update Metadata</span>
            </Button>
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={() => setAddLinkDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Save Link</span>
            </Button>
            <Button 
              variant="outline"
              className="glassmorphic"
              onClick={openCommandModal}
            >
              <span className="sr-only">Command</span>
              <kbd className="text-xs bg-muted px-2 py-0.5 rounded">⌘K</kbd>
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reading list..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Main content - 2 column layout */}
        <div className={cn(
          "gap-6",
          isMobile ? "flex flex-col" : "grid grid-cols-[280px_1fr]"
        )}>
          {/* Command Panel */}
          <div className={cn(
            isMobile ? "order-2" : "sticky top-24 self-start"
          )}>
            <ReadingCommandPanel
              items={readingItems}
              filter={filter}
              onFilterChange={setFilter}
              onSuggestedClick={(id) => {
                const item = readingItems.find(i => i.id === id);
                if (item) window.open(item.url, '_blank', 'noopener,noreferrer');
              }}
              onQuickAction={handleQuickAction}
              availableProjects={availableProjects}
            />
          </div>

          {/* Reading Grid */}
          <ScrollArea className="h-[calc(100vh-14rem)]">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-lg font-medium">No items found</p>
                <p className="text-sm">Try adjusting your filters or save some links</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pr-4">
                {filteredItems.map((item) => (
                  <motion.div
                    key={item.id}
                    className={cn(
                      "group relative rounded-xl backdrop-blur-sm transition-all duration-200 cursor-pointer",
                      "bg-white/60 dark:bg-zinc-900/40 border border-white/20 dark:border-white/10",
                      "shadow-sm hover:shadow-lg hover:scale-[1.02]",
                      item.isRead ? "opacity-60" : ""
                    )}
                    whileHover={{ scale: 1.02 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
                  >
                    <div className="p-4">
                      {/* Image */}
                      {item.image && (
                        <div className="mb-3">
                          <img 
                            src={item.image} 
                            alt=""
                            className="w-full h-32 rounded-lg object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      
                      {/* Header with favicon and actions */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {item.favicon && (
                            <img 
                              src={item.favicon} 
                              alt=""
                              className="w-4 h-4 rounded flex-shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                            {item.hostname || new URL(item.url).hostname}
                          </p>
                          {item.isFlagged && (
                            <Flag className="w-3 h-3 text-rose-500 flex-shrink-0" />
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            className={cn(
                              "h-6 w-6 rounded-full",
                              item.isFlagged ? "text-rose-500" : "text-zinc-500 hover:text-rose-500"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFlag(item.id);
                            }}
                          >
                            <Flag className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className={`h-6 w-6 rounded-full ${item.isRead ? 'text-green-500' : 'text-zinc-500 hover:text-green-500'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkRead(item.id);
                            }}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 rounded-full text-zinc-500 hover:text-rose-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item.id);
                            }}
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Title */}
                      <h3 className={cn(
                        "font-medium text-sm line-clamp-2 text-zinc-800 dark:text-white/90 mb-2",
                        item.isRead && "line-through"
                      )}>
                        {item.title}
                      </h3>
                      
                      {/* Description */}
                      {item.description && (
                        <p className="text-xs text-zinc-600 dark:text-white/60 line-clamp-3">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
      
      {/* Command Modal */}
      <CommandModal 
        isOpen={isCommandModalOpen} 
        onClose={closeCommandModal}
        onNavigate={navigate}
      />

      {/* Add Link Dialog */}
      <AddLinkDialog
        open={addLinkDialogOpen}
        onOpenChange={setAddLinkDialogOpen}
        onAddLink={handleAddLink}
      />

      {/* Add Task Dialog */}
      <AddTaskDialog
        open={addTaskDialogOpen}
        onOpenChange={(open) => {
          setAddTaskDialogOpen(open);
          if (!open) setTaskPrefill(null);
        }}
        onAddTask={(content) => {
          // Task is handled internally by the dialog
          console.log('Task created:', content);
        }}
        prefill={taskPrefill || undefined}
      />
    </div>
  );
}
