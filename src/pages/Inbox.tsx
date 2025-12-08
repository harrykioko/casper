import { useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InboxFilters } from "@/components/inbox/InboxFilters";
import { InboxItemRow } from "@/components/inbox/InboxItemRow";
import { InboxEmptyState } from "@/components/inbox/InboxEmptyState";
import { InboxDetailDrawer } from "@/components/dashboard/InboxDetailDrawer";
import { AddTaskDialog } from "@/components/modals/AddTaskDialog";
import type { InboxItem, TaskPrefillOptions } from "@/types/inbox";

type StatusFilter = "all" | "unread" | "read";
type DateFilter = "all" | "today" | "week" | "month";
type SortOption = "newest" | "oldest" | "unread";

export default function Inbox() {
  const navigate = useNavigate();
  const { inboxItems, isLoading, markAsRead, markComplete, archive } = useInboxItems();
  const { createTask } = useTasks();
  
  // Filters and sorting state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showFilters, setShowFilters] = useState(false);
  
  // Detail drawer state
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Task creation state
  const [taskPrefill, setTaskPrefill] = useState<TaskPrefillOptions | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    let result = [...inboxItems];
    
    // Filter by status
    if (statusFilter === "unread") {
      result = result.filter(item => !item.isRead);
    } else if (statusFilter === "read") {
      result = result.filter(item => item.isRead);
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
  }, [inboxItems, statusFilter, dateFilter, search, sortBy]);

  const openInboxDetail = (item: InboxItem) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
    if (!item.isRead) {
      markAsRead(item.id);
    }
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
    setSelectedItem(null);
  };

  const handleCreateTask = (item: InboxItem) => {
    setTaskPrefill({
      content: item.subject,
      description: item.preview || undefined,
      companyName: item.relatedCompanyName,
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

  const unreadCount = inboxItems.filter(item => !item.isRead).length;
  const hasFilters = statusFilter !== "all" || dateFilter !== "all" || search.trim() !== "";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4">
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
                  <h1 className="text-xl font-semibold text-foreground">Inbox</h1>
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

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <InboxEmptyState
            hasFilters={hasFilters}
            onClearFilters={() => {
              setStatusFilter("all");
              setDateFilter("all");
              setSearch("");
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

      {/* Detail Drawer */}
      <InboxDetailDrawer
        open={isDetailOpen}
        onClose={closeDetail}
        item={selectedItem}
        onCreateTask={handleCreateTask}
        onMarkComplete={handleMarkComplete}
        onArchive={handleArchive}
      />

      {/* Task Creation Dialog */}
      <AddTaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        onAddTask={(content) => createTask({ content })}
        prefill={taskPrefill || undefined}
      />
    </div>
  );
}
