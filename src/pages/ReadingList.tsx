
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CommandModal } from "@/components/modals/CommandModal";
import { ReadingItem } from "@/components/dashboard/ReadingList";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AddLinkDialog } from "@/components/modals/AddLinkDialog";
import { v4 as uuidv4 } from "uuid";

// Mock reading items
const mockReadingItems: ReadingItem[] = [
  {
    id: "r1",
    url: "https://ui.shadcn.com/",
    title: "shadcn/ui: Re-usable components built with Radix UI and Tailwind CSS",
    description: "Beautifully designed components that you can copy and paste into your apps.",
    favicon: "https://ui.shadcn.com/favicon.ico",
    isRead: false
  },
  {
    id: "r2",
    url: "https://tailwindcss.com/docs/customizing-colors",
    title: "Customizing Colors - Tailwind CSS",
    description: "Learn how to customize the default color palette for your project.",
    favicon: "https://tailwindcss.com/favicons/favicon.ico",
    isRead: false
  },
  {
    id: "r3",
    url: "https://react-typescript-cheatsheet.netlify.app/",
    title: "React TypeScript Cheatsheets",
    description: "Cheatsheets for experienced React developers getting started with TypeScript",
    favicon: "https://react-typescript-cheatsheet.netlify.app/favicon-96x96.png",
    isRead: true
  },
  {
    id: "r4",
    url: "https://www.framer.com/motion/",
    title: "Framer Motion: Production-Ready Animation",
    description: "A production-ready motion library for React from Framer. Animate with ease.",
    favicon: "https://www.framer.com/favicon.ico",
    isRead: false
  },
  {
    id: "r5",
    url: "https://www.supabase.io/docs",
    title: "Supabase Documentation",
    description: "Build in a weekend, scale to millions. Supabase is an open source Firebase alternative.",
    favicon: "https://www.supabase.io/favicon.ico",
    isRead: false
  }
];

export default function ReadingList() {
  const navigate = useNavigate();
  const [readingItems, setReadingItems] = useState<ReadingItem[]>(mockReadingItems);
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
  const handleMarkRead = (id: string) => {
    setReadingItems(items => 
      items.map(item => 
        item.id === id ? { ...item, isRead: !item.isRead } : item
      )
    );
  };
  
  // Handle deleting item
  const handleDelete = (id: string) => {
    setReadingItems(items => items.filter(item => item.id !== id));
  };

  // Handle adding a new link
  const handleAddLink = (linkData: Omit<ReadingItem, 'id'>) => {
    const newItem: ReadingItem = {
      ...linkData,
      id: uuidv4()
    };
    setReadingItems(items => [newItem, ...items]);
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
