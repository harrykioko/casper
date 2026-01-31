import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Plus, Search, RefreshCw } from "lucide-react";
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
import { toast } from "sonner";
import { ReadingCommandPanel } from "@/components/reading/ReadingCommandPanel";
import { ReadingUpNextSection } from "@/components/reading/ReadingUpNextSection";
import { ReadingQueueSection } from "@/components/reading/ReadingQueueSection";
import { ReadingItemCard } from "@/components/reading/ReadingItemCard";
import {
  ReadingFilter,
  applyReadingFilter,
  getUpNextItems,
  getQueueItems,
} from "@/components/reading/readingHelpers";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ReadingList() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const {
    readingItems,
    loading,
    createReadingItem,
    updateReadingItem,
    deleteReadingItem,
    updateExistingItemsWithMetadata,
  } = useReadingItems();
  const { projects } = useProjects();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  const [addLinkDialogOpen, setAddLinkDialogOpen] = useState(false);
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
  const [taskPrefill, setTaskPrefill] = useState<{
    content: string;
    description?: string;
  } | null>(null);
  const [updatingMetadata, setUpdatingMetadata] = useState(false);

  // Filter state — default to Library view
  const [filter, setFilter] = useState<ReadingFilter>({
    primaryView: "library",
    projects: [],
    contentTypes: [],
  });

  // Apply filters
  const filteredItems = useMemo(
    () => applyReadingFilter(readingItems, filter, searchQuery),
    [readingItems, filter, searchQuery]
  );

  // For the library view, split into Up Next and Queue sections
  const upNextItems = useMemo(() => {
    if (filter.primaryView !== "library") return [];
    const base = searchQuery || filter.projects.length || filter.contentTypes.length
      ? filteredItems.filter((i) => i.processingStatus === "up_next")
      : getUpNextItems(readingItems);
    return base;
  }, [readingItems, filteredItems, filter, searchQuery]);

  const queueItems = useMemo(() => {
    if (filter.primaryView !== "library") return [];
    const base = searchQuery || filter.projects.length || filter.contentTypes.length
      ? filteredItems.filter((i) => i.processingStatus === "queued")
      : getQueueItems(readingItems);
    return base;
  }, [readingItems, filteredItems, filter, searchQuery]);

  // Handlers
  const handleMarkRead = async (id: string) => {
    const item = readingItems.find((item) => item.id === id);
    if (item) {
      try {
        const updates: any = {
          is_read: !item.isRead,
          processing_status: !item.isRead ? "read" : item.processingStatus === "read" ? "queued" : item.processingStatus,
        };
        if (!item.isRead && !item.readAt) {
          updates.read_at = new Date().toISOString();
        }
        await updateReadingItem(id, updates);
        toast.success(item.isRead ? "Marked as unread" : "Marked as read");
      } catch (error) {
        console.error("Failed to update reading item:", error);
        toast.error("Failed to update item");
      }
    }
  };

  const handleFavorite = async (id: string) => {
    const item = readingItems.find((item) => item.id === id);
    if (item) {
      try {
        await updateReadingItem(id, { is_flagged: !item.isFlagged });
        toast.success(
          item.isFlagged ? "Removed from favorites" : "Added to favorites"
        );
      } catch (error) {
        console.error("Failed to favorite reading item:", error);
        toast.error("Failed to update item");
      }
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await updateReadingItem(id, {
        is_archived: true,
        processing_status: "archived",
        archived_at: new Date().toISOString(),
      });
      toast.success("Archived");
    } catch (error) {
      console.error("Failed to archive reading item:", error);
      toast.error("Failed to archive item");
    }
  };

  const handleUpdateProject = async (
    id: string,
    newProjectId: string | null
  ) => {
    try {
      await updateReadingItem(id, { project_id: newProjectId });
      const projectName = newProjectId
        ? projects.find((p) => p.id === newProjectId)?.name
        : null;
      toast.success(
        projectName ? `Added to ${projectName}` : "Removed from project"
      );
    } catch (error) {
      console.error("Failed to update reading item project:", error);
      toast.error("Failed to update project");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReadingItem(id);
      toast.success("Deleted");
    } catch (error) {
      console.error("Failed to delete reading item:", error);
      toast.error("Failed to delete item");
    }
  };

  const handleAddLink = async (linkData: any) => {
    try {
      await createReadingItem(linkData);
      setAddLinkDialogOpen(false);
      toast.success("Link saved");
    } catch (error) {
      console.error("Failed to create reading item:", error);
      toast.error("Failed to save link");
    }
  };

  const handleUpdateMetadata = async () => {
    setUpdatingMetadata(true);
    try {
      await updateExistingItemsWithMetadata();
      toast.success("Updated metadata for existing items");
    } catch (error) {
      console.error("Failed to update metadata:", error);
      toast.error("Failed to update metadata");
    } finally {
      setUpdatingMetadata(false);
    }
  };

  const handleQuickAction = async (
    itemId: string,
    action: "open" | "markRead" | "flag" | "archive" | "task"
  ) => {
    const item = readingItems.find((i) => i.id === itemId);
    if (!item) return;

    switch (action) {
      case "open":
        window.open(item.url, "_blank", "noopener,noreferrer");
        break;
      case "markRead":
        await handleMarkRead(itemId);
        break;
      case "flag":
        await handleFavorite(itemId);
        break;
      case "archive":
        await handleArchive(itemId);
        break;
      case "task":
        setTaskPrefill({
          content: `[Read] ${item.title}`,
          description: item.url,
        });
        setAddTaskDialogOpen(true);
        break;
    }
  };

  const openCommandModal = () => setIsCommandModalOpen(true);
  const closeCommandModal = () => setIsCommandModalOpen(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      openCommandModal();
    }
  };

  const availableProjects = useMemo(
    () => projects.map((p) => ({ id: p.id, name: p.name, color: p.color })),
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

  const isLibraryView = filter.primaryView === "library";

  return (
    <div
      className="p-8 pl-24 min-h-screen"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Reading Library</h1>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleUpdateMetadata}
              disabled={updatingMetadata}
            >
              <RefreshCw
                className={cn(
                  "h-4 w-4",
                  updatingMetadata && "animate-spin"
                )}
              />
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
              <kbd className="text-xs bg-muted px-2 py-0.5 rounded">
                ⌘K
              </kbd>
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reading library..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Main content - 2 column layout */}
        <div
          className={cn(
            "gap-6",
            isMobile ? "flex flex-col" : "grid grid-cols-[280px_1fr]"
          )}
        >
          {/* Command Panel */}
          <div
            className={cn(
              isMobile ? "order-2" : "sticky top-24 self-start"
            )}
          >
            <ReadingCommandPanel
              items={readingItems}
              filter={filter}
              onFilterChange={setFilter}
              onSuggestedClick={(id) => {
                const item = readingItems.find((i) => i.id === id);
                if (item)
                  window.open(item.url, "_blank", "noopener,noreferrer");
              }}
              onQuickAction={handleQuickAction}
              availableProjects={availableProjects}
            />
          </div>

          {/* Reading Content */}
          <ScrollArea className="h-[calc(100vh-14rem)]">
            {isLibraryView ? (
              /* Library view: sectioned Up Next + Queue */
              <div className="pr-4">
                {upNextItems.length === 0 && queueItems.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-lg font-medium">Your library is empty</p>
                    <p className="text-sm">
                      Save some links and triage them in Focus to build your
                      curated queue
                    </p>
                  </div>
                ) : (
                  <>
                    <ReadingUpNextSection
                      items={upNextItems}
                      projects={availableProjects}
                      onFavorite={handleFavorite}
                      onMarkRead={handleMarkRead}
                      onDelete={handleDelete}
                      onUpdateProject={handleUpdateProject}
                    />
                    <ReadingQueueSection
                      items={queueItems}
                      projects={availableProjects}
                      onFavorite={handleFavorite}
                      onMarkRead={handleMarkRead}
                      onDelete={handleDelete}
                      onUpdateProject={handleUpdateProject}
                    />
                  </>
                )}
              </div>
            ) : (
              /* Other views: flat grid */
              <div className="pr-4">
                {filteredItems.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-lg font-medium">No items found</p>
                    <p className="text-sm">
                      Try adjusting your filters or save some links
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredItems.map((item) => (
                      <ReadingItemCard
                        key={item.id}
                        item={item}
                        projects={availableProjects}
                        onFavorite={handleFavorite}
                        onMarkRead={handleMarkRead}
                        onDelete={handleDelete}
                        onUpdateProject={handleUpdateProject}
                      />
                    ))}
                  </div>
                )}
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
          console.log("Task created:", content);
        }}
        prefill={taskPrefill || undefined}
      />
    </div>
  );
}
