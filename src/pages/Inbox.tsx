import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Inbox as InboxIcon, 
  ArrowLeft,
  Search,
  SlidersHorizontal
} from "lucide-react";
import { useInboxItems } from "@/hooks/useInboxItems";
import { useTasks } from "@/hooks/useTasks";
import { useIsDesktop } from "@/hooks/use-mobile";
import { useGlobalInboxDrawer } from "@/contexts/GlobalInboxDrawerContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InboxFilters } from "@/components/inbox/InboxFilters";
import { InboxItemRow } from "@/components/inbox/InboxItemRow";
import { InboxEmptyState } from "@/components/inbox/InboxEmptyState";
import { InboxDetailDrawer } from "@/components/dashboard/InboxDetailDrawer";
import { InboxSummaryPanel } from "@/components/inbox/InboxSummaryPanel";
import { AddTaskDialog } from "@/components/modals/AddTaskDialog";
import { isActionRequired, isWaitingOn } from "@/components/inbox/inboxHelpers";
import type { InboxItem, TaskPrefillOptions, InboxViewFilter } from "@/types/inbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "unread" | "read";
type DateFilter = "all" | "today" | "week" | "month";
type SortOption = "newest" | "oldest" | "unread";

export default function Inbox() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const { openDrawer: openGlobalDrawer, closeDrawer: closeGlobalDrawer } = useGlobalInboxDrawer();
  const { inboxItems, isLoading, markAsRead, markComplete, archive, snooze } = useInboxItems();
  const { inboxItems: archivedItems, isLoading: isLoadingArchived } = useInboxItems({ onlyArchived: true });
  const { createTask } = useTasks();

  // Snooze handler
  const handleSnooze = (id: string, until: Date) => {
    snooze(id, until);
  };

  // Add note handler (placeholder - opens floating note or modal)
  const handleAddNote = (item: InboxItem) => {
    // For now, just show a toast - can be wired to AddNoteModal or FloatingNote
    toast.info("Add note feature coming soon");
  };
  
  // Filters and sorting state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showFilters, setShowFilters] = useState(false);
  
  // View filter from summary panel
  const [viewFilter, setViewFilter] = useState<InboxViewFilter>("all");
  
  // Detail pane state (for desktop embedded mode)
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);
  
  // Task creation state
  const [taskPrefill, setTaskPrefill] = useState<TaskPrefillOptions | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

  // Get the base items based on view filter
  const baseItems = useMemo(() => {
    if (viewFilter === 'archived') {
      return archivedItems;
    }
    
    let result = [...inboxItems];
    
    if (viewFilter === 'action') {
      result = result.filter(isActionRequired);
    } else if (viewFilter === 'waiting') {
      result = result.filter(isWaitingOn);
    }
    
    return result;
  }, [inboxItems, archivedItems, viewFilter]);

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    let result = [...baseItems];
    
    // Filter by status (only apply if not viewing archived)
    if (viewFilter !== 'archived') {
      if (statusFilter === "unread") {
        result = result.filter(item => !item.isRead);
      } else if (statusFilter === "read") {
        result = result.filter(item => item.isRead);
      }
    }
    
    // Filter by date
    if (dateFilter !== "all") {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      result = result.filter(item => {
        const itemDate = new Date(item.receivedAt);
        switch (dateFilter) {
          case "today":
            return itemDate >= startOfToday;
          case "week":
            const weekAgo = new Date(startOfToday);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return itemDate >= weekAgo;
          case "month":
            const monthAgo = new Date(startOfToday);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return itemDate >= monthAgo;
          default:
            return true;
        }
      });
    }
    
    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(item =>
        item.senderName.toLowerCase().includes(searchLower) ||
        item.senderEmail.toLowerCase().includes(searchLower) ||
        item.subject.toLowerCase().includes(searchLower) ||
        item.preview?.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort
    return result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
        case "oldest":
          return new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime();
        case "unread":
          if (a.isRead === b.isRead) {
            return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
          }
          return a.isRead ? 1 : -1;
        default:
          return 0;
      }
    });
  }, [baseItems, statusFilter, dateFilter, search, sortBy, viewFilter]);

  const openInboxDetail = (item: InboxItem) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }
    
    if (isDesktop) {
      // Desktop: Use embedded mode in 3-column layout
      setSelectedItem(item);
    } else {
      // Mobile: Use global drawer
      openGlobalDrawer(item, {
        onCreateTask: handleCreateTask,
        onMarkComplete: handleMarkComplete,
        onArchive: handleArchive,
        onSnooze: handleSnooze,
        onAddNote: handleAddNote,
      });
    }
  };

  const closeDetail = () => {
    setSelectedItem(null);
  };

  const handleCreateTask = (item: InboxItem, suggestionTitle?: string) => {
    setTaskPrefill({
      content: suggestionTitle || item.subject,
      description: item.preview || undefined,
      companyName: item.relatedCompanyName,
      sourceInboxItemId: item.id,
    });
    setIsTaskDialogOpen(true);
    closeDetail();
  };

  const handleMarkComplete = (id: string) => {
    markComplete(id);
  };

  const handleArchive = (id: string) => {
    archive(id);
  };

  const handleBulkArchive = (ids: string[]) => {
    ids.forEach(id => archive(id));
    toast.success(`Archived ${ids.length} messages`);
  };

  const unreadCount = inboxItems.filter(item => !item.isRead).length;
  const hasFilters = statusFilter !== "all" || dateFilter !== "all" || search.trim() !== "";

  const getViewFilterLabel = () => {
    switch (viewFilter) {
      case 'action': return 'Action Required';
      case 'waiting': return 'Waiting On';
      case 'archived': return 'Archived';
      default: return null;
    }
  };

  const isLoadingAny = isLoading || isLoadingArchived;

  // Determine grid columns based on desktop and selected item
  const gridClasses = cn(
    "grid gap-5",
    isDesktop && selectedItem
      ? "grid-cols-[280px_minmax(320px,1fr)_minmax(460px,1.4fr)] 2xl:grid-cols-[320px_minmax(400px,1.2fr)_minmax(560px,1.4fr)]"
      : isDesktop
        ? "grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[320px_1fr]"
        : "grid-cols-1"
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard")}
                className="h-9 w-9"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                  <InboxIcon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-semibold text-foreground">Inbox</h1>
                    {getViewFilterLabel() && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400">
                        {getViewFilterLabel()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {inboxItems.length} messages • {unreadCount} unread
                  </p>
                </div>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-accent" : ""}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4"
            >
              <InboxFilters
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                dateFilter={dateFilter}
                setDateFilter={setDateFilter}
                sortBy={sortBy}
                setSortBy={setSortBy}
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* Content - 3 column layout on desktop with selected item */}
      <div className="max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-4 lg:px-6 py-4">
        <div className={gridClasses}>
          {/* Left: Summary Panel (sticky) */}
          <div className="hidden lg:block sticky top-24 self-start">
            <InboxSummaryPanel
              items={inboxItems}
              archivedItems={archivedItems}
              activeFilter={viewFilter}
              onFilterChange={setViewFilter}
              onItemClick={openInboxDetail}
              onCreateTaskFromItem={handleCreateTask}
              onBulkArchive={handleBulkArchive}
            />
          </div>

          {/* Middle: Message List (scrollable) */}
          <div className="lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto pr-1">
            {isLoadingAny ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <InboxEmptyState
                hasFilters={hasFilters || viewFilter !== 'all'}
                onClearFilters={() => {
                  setStatusFilter("all");
                  setDateFilter("all");
                  setSearch("");
                  setViewFilter("all");
                }}
              />
            ) : (
              <div className="space-y-2">
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <InboxItemRow
                      item={item}
                      isSelected={selectedItem?.id === item.id}
                      onClick={() => openInboxDetail(item)}
                      onCreateTask={() => handleCreateTask(item)}
                      onMarkComplete={() => handleMarkComplete(item.id)}
                      onArchive={() => handleArchive(item.id)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Email Detail (embedded on desktop) */}
          {isDesktop && selectedItem && (
            <div className="sticky top-24 self-start h-[calc(100vh-8rem)]">
              <InboxDetailDrawer
                mode="embedded"
                open={true}
                onClose={closeDetail}
                item={selectedItem}
                onCreateTask={handleCreateTask}
                onMarkComplete={handleMarkComplete}
                onArchive={handleArchive}
                onSnooze={handleSnooze}
                onAddNote={handleAddNote}
              />
            </div>
          )}
        </div>
      </div>

      {/* Task Creation Dialog */}
      <AddTaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        onAddTask={(taskData) => createTask(taskData)}
        prefill={taskPrefill || undefined}
      />
    </div>
  );
}
