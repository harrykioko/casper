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
import { useIsDesktop } from "@/hooks/use-mobile";
import { useGlobalInboxDrawer } from "@/contexts/GlobalInboxDrawerContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InboxFilters } from "@/components/inbox/InboxFilters";
import { InboxItemRow } from "@/components/inbox/InboxItemRow";
import { InboxEmptyState } from "@/components/inbox/InboxEmptyState";
import { InboxSummaryPanel } from "@/components/inbox/InboxSummaryPanel";
import { AddTaskDialog } from "@/components/modals/AddTaskDialog";
import { LinkCompanyModal } from "@/components/inbox/LinkCompanyModal";
import { SaveAttachmentsModal } from "@/components/inbox/SaveAttachmentsModal";
import { isActionRequired, isWaitingOn } from "@/components/inbox/inboxHelpers";
import type { InboxItem, TaskPrefillOptions, InboxViewFilter } from "@/types/inbox";
import type { StructuredSuggestion } from "@/types/inboxSuggestions";
import type { InboxAttachment } from "@/hooks/useInboxAttachments";
import { usePipeline } from "@/hooks/usePipeline";
import { useAuth } from "@/contexts/AuthContext";
import { copyInboxAttachmentToPipeline } from "@/lib/inbox/copyAttachmentToCompany";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "unread" | "read";
type DateFilter = "all" | "today" | "week" | "month";
type SortOption = "newest" | "oldest" | "unread";

export default function Inbox() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const { openDrawer: openGlobalDrawer } = useGlobalInboxDrawer();
  const { inboxItems, isLoading, markAsRead, markComplete, archive, snooze, linkCompany } = useInboxItems();
  const { inboxItems: archivedItems, isLoading: isLoadingArchived } = useInboxItems({ onlyArchived: true });
  const { createTask } = useTasks();
  const { createCompany: createPipelineCompany } = usePipeline();
  const { user } = useAuth();

  // Snooze handler
  const handleSnooze = (id: string, until: Date) => {
    snooze(id, until);
  };

  // Add note handler (placeholder - opens floating note or modal)
  const handleAddNote = (item: InboxItem) => {
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
  
  // Task creation state
  const [taskPrefill, setTaskPrefill] = useState<TaskPrefillOptions | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  
  // Link Company modal state
  const [linkCompanyItem, setLinkCompanyItem] = useState<InboxItem | null>(null);
  
  // Save Attachments modal state
  const [saveAttachmentsItem, setSaveAttachmentsItem] = useState<InboxItem | null>(null);

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

  // Always use global drawer for detail view
  const openInboxDetail = (item: InboxItem) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }
    
    openGlobalDrawer(item, {
      onCreateTask: handleCreateTask,
      onMarkComplete: handleMarkComplete,
      onArchive: handleArchive,
      onSnooze: handleSnooze,
      onAddNote: handleAddNote,
      onLinkCompany: handleLinkCompany,
      onSaveAttachments: handleSaveAttachments,
      onApproveSuggestion: handleApproveSuggestion,
      onSaveAttachmentToCompany: handleSaveAttachmentToCompany,
    });
  };

  const handleCreateTask = (item: InboxItem, suggestionTitle?: string) => {
    setTaskPrefill({
      content: suggestionTitle || item.subject,
      description: item.preview || undefined,
      companyName: item.relatedCompanyName,
      sourceInboxItemId: item.id,
    });
    setIsTaskDialogOpen(true);
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

  const handleLinkCompany = (item: InboxItem) => {
    setLinkCompanyItem(item);
  };

  const handleSaveAttachments = (item: InboxItem) => {
    setSaveAttachmentsItem(item);
  };

  // Handler for saving a single attachment to a linked company
  const handleSaveAttachmentToCompany = async (item: InboxItem, attachment: InboxAttachment) => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    if (item.relatedCompanyId) {
      // Company is linked - save directly
      const result = await copyInboxAttachmentToPipeline(
        attachment,
        item.relatedCompanyId,
        user.id
      );
      if (result.success) {
        toast.success(`Saved "${attachment.filename}" to ${item.relatedCompanyName || "company"}`);
      } else {
        toast.error(result.error || "Failed to save attachment");
      }
    } else {
      // No company linked - open the save attachments modal
      setSaveAttachmentsItem(item);
    }
  };

  const handleApproveSuggestion = async (item: InboxItem, suggestion: StructuredSuggestion) => {
    switch (suggestion.type) {
      case "LINK_COMPANY": {
        if (suggestion.company_id) {
          linkCompany(item.id, suggestion.company_id, suggestion.company_name || null);
          toast.success(`Linked to ${suggestion.company_name || "company"}`);
        } else {
          // No company_id in suggestion — open the link company modal for manual selection
          setLinkCompanyItem(item);
        }
        break;
      }
      case "CREATE_PIPELINE_COMPANY": {
        const companyName = suggestion.company_name || item.senderName;
        try {
          const newCompany = await createPipelineCompany({
            company_name: companyName,
            current_round: "unknown" as any,
            website: item.senderEmail ? item.senderEmail.split("@")[1] : undefined,
          });
          if (newCompany?.id) {
            linkCompany(item.id, newCompany.id, companyName);
          }
          toast.success(`${companyName} added to pipeline`);
        } catch {
          toast.error("Failed to create pipeline company");
        }
        break;
      }
      case "CREATE_FOLLOW_UP_TASK": {
        setTaskPrefill({
          content: suggestion.title,
          description: item.preview || undefined,
          companyId: suggestion.company_id || item.relatedCompanyId || undefined,
          companyType: suggestion.company_type || undefined,
          companyName: suggestion.company_name || item.relatedCompanyName || undefined,
          sourceInboxItemId: item.id,
          category: "follow_up",
        });
        setIsTaskDialogOpen(true);
        break;
      }
      case "CREATE_PERSONAL_TASK": {
        setTaskPrefill({
          content: suggestion.title,
          description: item.preview || undefined,
          sourceInboxItemId: item.id,
          category: "personal",
        });
        setIsTaskDialogOpen(true);
        break;
      }
      case "CREATE_INTRO_TASK": {
        setTaskPrefill({
          content: suggestion.title,
          description: item.preview || undefined,
          companyId: suggestion.company_id || item.relatedCompanyId || undefined,
          companyType: suggestion.company_type || undefined,
          companyName: suggestion.company_name || item.relatedCompanyName || undefined,
          sourceInboxItemId: item.id,
          category: "intro",
        });
        setIsTaskDialogOpen(true);
        break;
      }
      case "SET_STATUS": {
        toast.info("Status update coming soon");
        break;
      }
      case "EXTRACT_UPDATE_HIGHLIGHTS": {
        toast.info("Highlights extraction coming soon");
        break;
      }
      default: {
        // Fallback: create a task
        handleCreateTask(item, suggestion.title);
        break;
      }
    }
  };

  const handleCompanyLinked = (companyId: string, companyName: string, companyType: 'pipeline' | 'portfolio') => {
    if (linkCompanyItem) {
      linkCompany(linkCompanyItem.id, companyId, companyName);
      setLinkCompanyItem(null);
    }
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

  // 2-column layout: summary panel + message list
  const gridClasses = cn(
    "grid gap-5",
    isDesktop
      ? "grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[320px_1fr]"
      : "grid-cols-1"
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-6 py-4">
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

      {/* Content - 2 column layout on desktop */}
      <div className="max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-4 lg:px-6 py-4">
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

          {/* Right: Message List (scrollable) */}
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
                      isSelected={false}
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
        </div>
      </div>

      {/* Task Creation Dialog */}
      <AddTaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        onAddTask={(taskData) => createTask(taskData)}
        prefill={taskPrefill || undefined}
      />

      {/* Link Company Modal */}
      {linkCompanyItem && (
        <LinkCompanyModal
          open={!!linkCompanyItem}
          onOpenChange={(open) => !open && setLinkCompanyItem(null)}
          inboxItem={linkCompanyItem}
          onLinked={handleCompanyLinked}
        />
      )}

      {/* Save Attachments Modal */}
      {saveAttachmentsItem && (
        <SaveAttachmentsModal
          open={!!saveAttachmentsItem}
          onOpenChange={(open) => !open && setSaveAttachmentsItem(null)}
          inboxItemId={saveAttachmentsItem.id}
          linkedCompanyId={saveAttachmentsItem.relatedCompanyId}
          linkedCompanyName={saveAttachmentsItem.relatedCompanyName}
          linkedCompanyType={saveAttachmentsItem.relatedCompanyId ? 'pipeline' : undefined}
          onLinkCompany={(companyId, companyName) => {
            linkCompany(saveAttachmentsItem.id, companyId, companyName);
          }}
        />
      )}
    </div>
  );
}
