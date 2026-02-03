import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Crosshair, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsDesktop } from "@/hooks/use-mobile";
import { useFocusQueue, type FocusQueueItem } from "@/hooks/useFocusQueue";
import { useFocusTriageActions } from "@/hooks/useFocusTriageActions";
import { useFocusReadingActions } from "@/hooks/useFocusReadingActions";
import { useTasks } from "@/hooks/useTasks";
import { useInboxItems } from "@/hooks/useInboxItems";
import { useOutlookCalendar } from "@/hooks/useOutlookCalendar";
import { FocusSummaryPanel } from "@/components/focus/FocusSummaryPanel";
import { FocusItemRow } from "@/components/focus/FocusItemRow";
import { FocusEmptyState } from "@/components/focus/FocusEmptyState";
import { FocusInboxDrawer } from "@/components/focus/FocusInboxDrawer";
import { FocusTaskDrawer } from "@/components/focus/FocusTaskDrawer";
import { FocusEventModal } from "@/components/focus/FocusEventModal";
import { FocusGenericSheet } from "@/components/focus/FocusGenericSheet";
import { FocusReadingSheet } from "@/components/focus/FocusReadingSheet";
import { cn } from "@/lib/utils";
import type { InboxItem } from "@/types/inbox";
import type { Task } from "@/hooks/useTasks";

export default function FocusQueue() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();

  // Focus data
  const {
    items,
    counts,
    isLoading,
    isAllClear,
    filters,
    toggleSourceType,
    toggleReasonCode,
    clearFilters,
  } = useFocusQueue();

  const triageActions = useFocusTriageActions();
  const readingActions = useFocusReadingActions();

  // Source data hooks (for fetching full records when opening drawers)
  const { tasks, updateTask, deleteTask, archiveTask, unarchiveTask } = useTasks();
  const { inboxItems, markComplete, archive: archiveInbox } = useInboxItems();
  const { events } = useOutlookCalendar();

  // Drawer state
  const [selectedItem, setSelectedItem] = useState<FocusQueueItem | null>(null);
  const [inboxDrawerItem, setInboxDrawerItem] = useState<InboxItem | null>(null);
  const [taskDrawerItem, setTaskDrawerItem] = useState<Task | null>(null);
  const [eventModalItem, setEventModalItem] = useState<any>(null);
  const [genericSheetItem, setGenericSheetItem] = useState<FocusQueueItem | null>(null);
  const [readingSheetItem, setReadingSheetItem] = useState<FocusQueueItem | null>(null);

  // Auto-advance to next item after triage
  const advanceToNext = useCallback(() => {
    if (!selectedItem) return;
    const currentIndex = items.findIndex(i => i.id === selectedItem.id);
    const nextItem = items[currentIndex + 1] || items[currentIndex - 1] || null;
    setSelectedItem(nextItem);
  }, [selectedItem, items]);

  // Open the appropriate drawer for a selected item
  const handleItemClick = useCallback(
    (item: FocusQueueItem) => {
      setSelectedItem(item);

      switch (item.source_type) {
        case "email": {
          const inboxItem = inboxItems.find(i => i.id === item.source_id);
          if (inboxItem) {
            setInboxDrawerItem(inboxItem);
          }
          break;
        }
        case "task": {
          const task = tasks.find(t => t.id === item.source_id);
          if (task) {
            setTaskDrawerItem(task);
          }
          break;
        }
        case "calendar_event": {
          const event = events.find(e => e.id === item.source_id);
          if (event) {
            setEventModalItem(event);
          }
          break;
        }
        case "reading":
          setReadingSheetItem(item);
          break;
        case "note":
          setGenericSheetItem(item);
          break;
        default:
          break;
      }
    },
    [inboxItems, tasks, events]
  );

  const closeAllDrawers = useCallback(() => {
    setInboxDrawerItem(null);
    setTaskDrawerItem(null);
    setEventModalItem(null);
    setGenericSheetItem(null);
    setReadingSheetItem(null);
  }, []);

  // Triage handlers that close drawer + advance
  const handleTrusted = useCallback(() => {
    if (!selectedItem) return;
    triageActions.markTrusted(selectedItem.id);
    closeAllDrawers();
    advanceToNext();
  }, [selectedItem, triageActions, closeAllDrawers, advanceToNext]);

  const handleSnooze = useCallback(
    (until: Date) => {
      if (!selectedItem) return;
      triageActions.snooze(selectedItem.id, until);
      closeAllDrawers();
      advanceToNext();
    },
    [selectedItem, triageActions, closeAllDrawers, advanceToNext]
  );

  const handleNoAction = useCallback(() => {
    if (!selectedItem) return;
    triageActions.noAction(selectedItem.id);
    closeAllDrawers();
    advanceToNext();
  }, [selectedItem, triageActions, closeAllDrawers, advanceToNext]);

  const showLink = selectedItem?.reason_codes.includes("unlinked_company") ?? false;

  // Inbox-specific handlers
  const handleCreateTaskFromInbox = useCallback((item: InboxItem) => {
    // Navigate to tasks page with context — or open task creation
    navigate("/tasks");
  }, [navigate]);

  const handleMarkInboxComplete = useCallback(
    (id: string) => {
      markComplete(id);
      closeAllDrawers();
      advanceToNext();
    },
    [markComplete, closeAllDrawers, advanceToNext]
  );

  const handleArchiveInbox = useCallback(
    (id: string) => {
      archiveInbox(id);
      closeAllDrawers();
      advanceToNext();
    },
    [archiveInbox, closeAllDrawers, advanceToNext]
  );

  // Reading quick action handlers
  const handleReadingQueue = useCallback(
    (workItemId: string, sourceId: string) => {
      readingActions.keepAsQueued(sourceId, workItemId);
      advanceToNext();
    },
    [readingActions, advanceToNext]
  );

  const handleReadingUpNext = useCallback(
    (workItemId: string, sourceId: string) => {
      readingActions.markUpNext(sourceId, workItemId);
      advanceToNext();
    },
    [readingActions, advanceToNext]
  );

  const handleReadingArchive = useCallback(
    (workItemId: string, sourceId: string) => {
      readingActions.archiveFromFocus(sourceId, workItemId);
      advanceToNext();
    },
    [readingActions, advanceToNext]
  );

  const handleReadingOpenLink = useCallback((url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-6 py-4">
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
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <Crosshair className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Focus</h1>
                <p className="text-sm text-muted-foreground">
                  {isAllClear
                    ? "All clear"
                    : `${counts.total} item${counts.total !== 1 ? "s" : ""} need review`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content - 2 column layout */}
      <div className="max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-6 py-6">
        <div
          className={cn(
            "grid gap-6",
            isDesktop
              ? "grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[320px_1fr]"
              : "grid-cols-1"
          )}
        >
          {/* Left: Summary Panel (desktop only) */}
          {isDesktop && (
            <FocusSummaryPanel
              counts={counts}
              isAllClear={isAllClear}
              filters={filters}
              onToggleSourceType={toggleSourceType}
              onToggleReasonCode={toggleReasonCode}
              onClearFilters={clearFilters}
            />
          )}

          {/* Center: Item list */}
          <div
            className={cn(
              isDesktop &&
                "lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto lg:pr-2"
            )}
          >
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    className="h-16 rounded-lg bg-muted/20 animate-pulse"
                  />
                ))}
              </div>
            ) : isAllClear ? (
              <FocusEmptyState />
            ) : (
              <div className="space-y-1.5">
                {items.map((item, index) => (
                  <FocusItemRow
                    key={item.id}
                    item={item}
                    isSelected={selectedItem?.id === item.id}
                    onClick={() => handleItemClick(item)}
                    index={index}
                    onReadingQueue={handleReadingQueue}
                    onReadingUpNext={handleReadingUpNext}
                    onReadingArchive={handleReadingArchive}
                    onReadingOpenLink={handleReadingOpenLink}
                    onSnooze={(id, until) => triageActions.snooze(id, until)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drawers / Modals */}
      <FocusInboxDrawer
        open={!!inboxDrawerItem}
        onClose={closeAllDrawers}
        item={inboxDrawerItem}
        onCreateTask={handleCreateTaskFromInbox}
        onMarkComplete={handleMarkInboxComplete}
        onArchive={handleArchiveInbox}
        onMarkTrusted={handleTrusted}
        onSnooze={handleSnooze}
        onNoAction={handleNoAction}
        showLink={showLink}
      />

      <FocusTaskDrawer
        open={!!taskDrawerItem}
        onClose={closeAllDrawers}
        task={taskDrawerItem}
        onUpdateTask={updateTask}
        onDeleteTask={deleteTask}
        onArchiveTask={archiveTask}
        onUnarchiveTask={unarchiveTask}
        onMarkTrusted={handleTrusted}
        onSnooze={handleSnooze}
        onNoAction={handleNoAction}
        showLink={showLink}
      />

      <FocusEventModal
        event={eventModalItem}
        isOpen={!!eventModalItem}
        onClose={closeAllDrawers}
        onMarkTrusted={handleTrusted}
        onSnooze={handleSnooze}
        onNoAction={handleNoAction}
        showLink={showLink}
      />

      <FocusReadingSheet
        open={!!readingSheetItem}
        onClose={closeAllDrawers}
        item={readingSheetItem}
        onAdvance={advanceToNext}
        onSnooze={handleSnooze}
      />

      <FocusGenericSheet
        open={!!genericSheetItem}
        onClose={closeAllDrawers}
        item={genericSheetItem}
        onMarkTrusted={handleTrusted}
        onSnooze={handleSnooze}
        onNoAction={handleNoAction}
        showLink={showLink}
      />
    </div>
  );
}
