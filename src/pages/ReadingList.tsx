
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CommandModal } from "@/components/modals/CommandModal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AddLinkDialog } from "@/components/modals/AddLinkDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useReadingItems } from "@/hooks/useReadingItems";

export default function ReadingList() {
  const navigate = useNavigate();
  const { readingItems, loading, createReadingItem, updateReadingItem, deleteReadingItem } = useReadingItems();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  const [addLinkDialogOpen, setAddLinkDialogOpen] = useState(false);
  
  // Filter reading items based on search query
  const filteredItems = readingItems.filter(item => 
    !searchQuery || 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    item.url.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Handle marking item as read/unread
  const handleMarkRead = async (id: string) => {
    const item = readingItems.find(item => item.id === id);
    if (item) {
      try {
        await updateReadingItem(id, { is_read: !item.isRead });
      } catch (error) {
        console.error('Failed to update reading item:', error);
      }
    }
  };
  
  // Handle deleting item
  const handleDelete = async (id: string) => {
    try {
      await deleteReadingItem(id);
    } catch (error) {
      console.error('Failed to delete reading item:', error);
    }
  };

  // Handle adding a new link
  const handleAddLink = async (linkData: any) => {
    try {
      await createReadingItem(linkData);
      setAddLinkDialogOpen(false);
    } catch (error) {
      console.error('Failed to create reading item:', error);
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

  if (loading) {
    return (
      <div className="p-8 pl-24 min-h-screen">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-9 w-40" />
            <div className="flex gap-3">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-16" />
            </div>
          </div>
          <Skeleton className="h-10 w-full mb-6" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
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
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Reading List</h1>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={() => setAddLinkDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span>Save Link</span>
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
        
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reading list..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-4 pr-4">
            {filteredItems.map((item) => (
              <div 
                key={item.id}
                className="group p-4 rounded-lg hover:glassmorphic transition-all duration-200"
              >
                <div className="flex gap-4">
                  {item.favicon ? (
                    <img 
                      src={item.favicon} 
                      alt=""
                      className="w-10 h-10 rounded-sm object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-sm bg-accent flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-5 w-5 opacity-70" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 
                        className={`font-medium line-clamp-2 ${item.isRead ? "text-muted-foreground" : ""}`}
                      >
                        {item.title}
                      </h3>
                      
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100"
                          onClick={() => handleDelete(item.id)}
                        >
                          Delete
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="opacity-0 group-hover:opacity-100"
                        >
                          <a href={item.url} target="_blank" rel="noopener noreferrer">
                            Open
                          </a>
                        </Button>
                      </div>
                    </div>
                    
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    )}
                    
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground truncate">
                        {item.url}
                      </p>
                      
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-sm"
                        onClick={() => handleMarkRead(item.id)}
                      >
                        {item.isRead ? 'Mark as unread' : 'Mark as read'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredItems.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-lg font-medium">No items found</p>
                <p className="text-sm">Try adjusting your search or save some links</p>
              </div>
            )}
          </div>
        </ScrollArea>
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
    </div>
  );
}
