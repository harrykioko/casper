import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  AlertTriangle, 
  ArrowLeft,
  Search,
  SlidersHorizontal
} from "lucide-react";
import { useUnifiedPriorityV1 } from "@/hooks/useUnifiedPriorityV1";
import type { PriorityItem, PrioritySourceType, PriorityIconType } from "@/types/priority";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PriorityFilters } from "@/components/priority/PriorityFilters";
import { PriorityItemRow } from "@/components/priority/PriorityItemRow";
import { PriorityEmptyState } from "@/components/priority/PriorityEmptyState";
import { useTasks, Task } from "@/hooks/useTasks";
import { useInboxItems } from "@/hooks/useInboxItems";
import { useOutlookCalendar } from "@/hooks/useOutlookCalendar";
import { InboxDetailDrawer } from "@/components/dashboard/InboxDetailDrawer";
import { TaskDetailsDialog } from "@/components/modals/TaskDetailsDialog";
import { EventDetailsModal } from "@/components/dashboard/EventDetailsModal";
import type { InboxItem } from "@/types/inbox";
import type { CalendarEvent } from "@/types/outlook";

type SourceFilter = "all" | PrioritySourceType;
type UrgencyFilter = "all" | PriorityIconType;
type SortOption = "score" | "due" | "recency";

export default function Priority() {
  const navigate = useNavigate();
  const { items, loading, debug, totalCount } = useUnifiedPriorityV1();
  const { tasks, updateTask } = useTasks();
  const { markComplete: markInboxComplete, inboxItems } = useInboxItems();
  const { events } = useOutlookCalendar();
  
  // All items from debug, or fallback to the top 8 items
  const allItems = debug.allItems.length > 0 ? debug.allItems : items;
  
  // Filters and sorting state
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("score");
  const [showFilters, setShowFilters] = useState(false);
  
  // Resolved items tracking
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  
  // Detail modal states
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedInboxItem, setSelectedInboxItem] = useState<InboxItem | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    let result = allItems.filter(item => !resolvedIds.has(item.id));
    
    // Filter by source type
    if (sourceFilter !== "all") {
      result = result.filter(item => item.sourceType === sourceFilter);
    }
    
    // Filter by urgency/icon type
    if (urgencyFilter !== "all") {
      result = result.filter(item => item.iconType === urgencyFilter);
    }
    
    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(item =>
        item.title.toLowerCase().includes(searchLower) ||
        item.subtitle?.toLowerCase().includes(searchLower) ||
        item.reasoning?.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort
    return [...result].sort((a, b) => {
      switch (sortBy) {
        case "score":
          return b.priorityScore - a.priorityScore;
        case "due":
          if (!a.dueAt && !b.dueAt) return 0;
          if (!a.dueAt) return 1;
          if (!b.dueAt) return -1;
          return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
        case "recency":
          const aTime = a.createdAt || a.lastTouchedAt || "";
          const bTime = b.createdAt || b.lastTouchedAt || "";
          return bTime.localeCompare(aTime);
        default:
          return 0;
      }
    });
  }, [allItems, sourceFilter, urgencyFilter, search, sortBy, resolvedIds]);

  const handleResolve = (item: PriorityItem) => {
    switch (item.sourceType) {
      case "task":
        updateTask(item.sourceId, { completed: true });
        break;
      case "inbox":
        markInboxComplete(item.sourceId);
        break;
    }
    setResolvedIds(prev => new Set(prev).add(item.id));
  };

  const handleItemClick = (item: PriorityItem) => {
    switch (item.sourceType) {
      case "task":
        const task = tasks?.find(t => t.id === item.sourceId);
        if (task) {
          setSelectedTask(task);
        }
        break;
      case "inbox":
        const inboxItem = inboxItems?.find(i => i.id === item.sourceId);
        if (inboxItem) {
          setSelectedInboxItem(inboxItem);
        }
        break;
      case "calendar_event":
        const event = events?.find(e => e.id === item.sourceId);
        if (event) {
          setSelectedEvent(event);
        }
        break;
      case "portfolio_company":
        if (item.companyId) {
          navigate(`/portfolio/${item.companyId}`);
        }
        break;
      case "pipeline_company":
        if (item.companyId) {
          navigate(`/pipeline?company=${item.companyId}`);
        }
        break;
    }
  };

  // Get unique source types and icon types for filter options
  const availableSourceTypes = useMemo(() => {
    const types = new Set(allItems.map(item => item.sourceType));
    return Array.from(types);
  }, [allItems]);

  const availableIconTypes = useMemo(() => {
    const types = new Set(allItems.map(item => item.iconType).filter(Boolean));
    return Array.from(types) as PriorityIconType[];
  }, [allItems]);

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
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-foreground">Priority Items</h1>
                  <p className="text-sm text-muted-foreground">
                    {totalCount} total • {filteredItems.length} showing
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
              placeholder="Search priority items..."
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
              <PriorityFilters
                sourceFilter={sourceFilter}
                setSourceFilter={setSourceFilter}
                urgencyFilter={urgencyFilter}
                setUrgencyFilter={setUrgencyFilter}
                sortBy={sortBy}
                setSortBy={setSortBy}
                availableSourceTypes={availableSourceTypes}
                availableIconTypes={availableIconTypes}
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <PriorityEmptyState
            hasFilters={sourceFilter !== "all" || urgencyFilter !== "all" || search.trim() !== ""}
            onClearFilters={() => {
              setSourceFilter("all");
              setUrgencyFilter("all");
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
                <PriorityItemRow
                  item={item}
                  onClick={() => handleItemClick(item)}
                  onResolve={() => handleResolve(item)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Task Details Dialog */}
      <TaskDetailsDialog
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
        task={selectedTask}
        onUpdateTask={(task) => {
          updateTask(task.id, task);
          setSelectedTask(null);
        }}
        onDeleteTask={() => setSelectedTask(null)}
      />

      {/* Inbox Detail Drawer */}
      <InboxDetailDrawer
        open={!!selectedInboxItem}
        onClose={() => setSelectedInboxItem(null)}
        item={selectedInboxItem}
        onCreateTask={() => {}}
        onMarkComplete={(id) => {
          markInboxComplete(id);
          setSelectedInboxItem(null);
        }}
        onArchive={() => setSelectedInboxItem(null)}
      />

      {/* Event Details Modal */}
      <EventDetailsModal
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
