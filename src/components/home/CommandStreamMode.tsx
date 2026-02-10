import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CommandStreamLayout } from "./CommandStreamLayout";
import { CommandFilterPanel } from "./CommandFilterPanel";
import { CommandActionStream } from "./CommandActionStream";
import { CommandAssistPanel } from "./CommandAssistPanel";
import { useTriageQueue, type TriageQueueItem } from "@/hooks/useTriageQueue";
import { useTriageActions } from "@/hooks/useTriageActions";
import { useTriageReadingActions } from "@/hooks/useTriageReadingActions";
import { useInboxItems } from "@/hooks/useInboxItems";
import { useOutlookCalendar } from "@/hooks/useOutlookCalendar";
import { useCommitments } from "@/hooks/useCommitments";
import { useTasks } from "@/hooks/useTasks";

// Drawers
import { TriageInboxDrawer } from "@/components/focus/TriageInboxDrawer";
import { TriageTaskDrawer } from "@/components/focus/TriageTaskDrawer";
import { TriageCommitmentDrawer } from "@/components/focus/TriageCommitmentDrawer";
import { TriageEventModal } from "@/components/focus/TriageEventModal";
import { TriageReadingSheet } from "@/components/focus/TriageReadingSheet";
import { TriageGenericSheet } from "@/components/focus/TriageGenericSheet";

import type { InboxItem } from "@/types/inbox";
import type { Task } from "@/hooks/useTasks";
import type { Commitment } from "@/types/commitment";

export function CommandStreamMode() {
  const navigate = useNavigate();

  // Data
  const {
    items,
    counts,
    isLoading,
    isAllClear,
    filters,
    toggleSourceType,
    setEffortFilter,
    clearFilters,
    optimisticRemove,
  } = useTriageQueue();

  const triageActions = useTriageActions(optimisticRemove);
  const readingActions = useTriageReadingActions(optimisticRemove);

  const { tasks, updateTask, deleteTask } = useTasks();
  const { inboxItems, markComplete, archive: archiveInbox } = useInboxItems();
  const { events } = useOutlookCalendar();
  const { commitments } = useCommitments({ status: ['open', 'waiting_on', 'delegated'] });

  // Drawer state
  const [selectedItem, setSelectedItem] = useState<TriageQueueItem | null>(null);
  const [inboxDrawerItem, setInboxDrawerItem] = useState<InboxItem | null>(null);
  const [taskDrawerItem, setTaskDrawerItem] = useState<Task | null>(null);
  const [commitmentDrawerItem, setCommitmentDrawerItem] = useState<Commitment | null>(null);
  const [eventModalItem, setEventModalItem] = useState<any>(null);
  const [genericSheetItem, setGenericSheetItem] = useState<TriageQueueItem | null>(null);
  const [readingSheetItem, setReadingSheetItem] = useState<TriageQueueItem | null>(null);

  const closeAllDrawers = useCallback(() => {
    setSelectedItem(null);
    setInboxDrawerItem(null);
    setTaskDrawerItem(null);
    setCommitmentDrawerItem(null);
    setEventModalItem(null);
    setGenericSheetItem(null);
    setReadingSheetItem(null);
  }, []);

  const advanceToNext = useCallback(() => {
    setSelectedItem(null);
  }, []);

  const handleItemClick = useCallback(
    (item: TriageQueueItem) => {
      setSelectedItem(item);
      switch (item.source_type) {
        case "email": {
          const found = inboxItems.find(i => i.id === item.source_id);
          if (found) setInboxDrawerItem(found);
          break;
        }
        case "task": {
          const found = tasks.find(t => t.id === item.source_id);
          if (found) setTaskDrawerItem(found);
          break;
        }
        case "calendar_event": {
          const found = events.find(e => e.id === item.source_id);
          if (found) setEventModalItem(found);
          break;
        }
        case "commitment": {
          const found = commitments.find(c => c.id === item.source_id);
          if (found) setCommitmentDrawerItem(found);
          break;
        }
        case "reading":
          setReadingSheetItem(item);
          break;
        case "note":
          setGenericSheetItem(item);
          break;
      }
    },
    [inboxItems, tasks, events, commitments]
  );

  // Quick actions
  const handleTrusted = useCallback((workItemId: string) => {
    triageActions.markTrusted(workItemId);
    advanceToNext();
  }, [triageActions, advanceToNext]);

  const handleNoAction = useCallback((workItemId: string) => {
    triageActions.noAction(workItemId);
    advanceToNext();
  }, [triageActions, advanceToNext]);

  const handleSnooze = useCallback((workItemId: string, until: Date) => {
    triageActions.snooze(workItemId, until);
    advanceToNext();
  }, [triageActions, advanceToNext]);

  // Drawer-level triage actions
  const handleDrawerTrusted = useCallback(() => {
    if (!selectedItem) return;
    handleTrusted(selectedItem.id);
    closeAllDrawers();
  }, [selectedItem, handleTrusted, closeAllDrawers]);

  const handleDrawerSnooze = useCallback((until: Date) => {
    if (!selectedItem) return;
    handleSnooze(selectedItem.id, until);
    closeAllDrawers();
  }, [selectedItem, handleSnooze, closeAllDrawers]);

  const handleDrawerNoAction = useCallback(() => {
    if (!selectedItem) return;
    handleNoAction(selectedItem.id);
    closeAllDrawers();
  }, [selectedItem, handleNoAction, closeAllDrawers]);

  const showLink = selectedItem?.reason_codes.includes("unlinked_company") ?? false;

  // Commitment drawer actions
  const handleCommitmentComplete = useCallback(() => {
    if (!selectedItem || !commitmentDrawerItem) return;
    triageActions.completeCommitment(commitmentDrawerItem.id, selectedItem.id);
    closeAllDrawers();
  }, [selectedItem, commitmentDrawerItem, triageActions, closeAllDrawers]);

  const handleCommitmentDelegate = useCallback(() => {
    if (!selectedItem || !commitmentDrawerItem) return;
    triageActions.delegateCommitment(commitmentDrawerItem.id, selectedItem.id, "", "Delegated");
    closeAllDrawers();
  }, [selectedItem, commitmentDrawerItem, triageActions, closeAllDrawers]);

  const handleCommitmentWaitingOn = useCallback(() => {
    if (!commitmentDrawerItem || !selectedItem) return;
    triageActions.markWaitingOn(commitmentDrawerItem.id, selectedItem.id);
    closeAllDrawers();
  }, [commitmentDrawerItem, selectedItem, triageActions, closeAllDrawers]);

  const handleCommitmentFollowUp = useCallback(() => {
    if (!commitmentDrawerItem) return;
    navigate("/tasks");
    closeAllDrawers();
  }, [commitmentDrawerItem, navigate, closeAllDrawers]);

  const handleCommitmentBroken = useCallback(() => {
    if (!selectedItem || !commitmentDrawerItem) return;
    triageActions.breakCommitment(commitmentDrawerItem.id, selectedItem.id);
    closeAllDrawers();
  }, [selectedItem, commitmentDrawerItem, triageActions, closeAllDrawers]);

  const handleCommitmentCancel = useCallback(() => {
    if (!selectedItem || !commitmentDrawerItem) return;
    triageActions.cancelCommitment(commitmentDrawerItem.id, selectedItem.id);
    closeAllDrawers();
  }, [selectedItem, commitmentDrawerItem, triageActions, closeAllDrawers]);

  // Inbox drawer actions
  const handleCreateTaskFromInbox = useCallback(() => {
    navigate("/tasks");
  }, [navigate]);

  const handleMarkInboxComplete = useCallback((id: string) => {
    markComplete(id);
    closeAllDrawers();
  }, [markComplete, closeAllDrawers]);

  const handleArchiveInbox = useCallback((id: string) => {
    archiveInbox(id);
    closeAllDrawers();
  }, [archiveInbox, closeAllDrawers]);

  return (
    <motion.div
      key="command"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <CommandStreamLayout
        filterPanel={
          <CommandFilterPanel
            counts={counts}
            filters={filters}
            onToggleSourceType={toggleSourceType}
            onSetEffortFilter={setEffortFilter}
            onClearFilters={clearFilters}
          />
        }
        actionStream={
          <CommandActionStream
            items={items}
            isLoading={isLoading}
            onItemClick={handleItemClick}
            onTrusted={handleTrusted}
            onNoAction={handleNoAction}
            onSnooze={handleSnooze}
          />
        }
        assistPanel={
          <CommandAssistPanel events={events} />
        }
      />

      {/* Drawers */}
      <TriageInboxDrawer
        open={!!inboxDrawerItem}
        onClose={closeAllDrawers}
        item={inboxDrawerItem}
        onCreateTask={handleCreateTaskFromInbox}
        onMarkComplete={handleMarkInboxComplete}
        onArchive={handleArchiveInbox}
        onMarkTrusted={handleDrawerTrusted}
        onSnooze={handleDrawerSnooze}
        onNoAction={handleDrawerNoAction}
        showLink={showLink}
      />

      <TriageTaskDrawer
        open={!!taskDrawerItem}
        onClose={closeAllDrawers}
        task={taskDrawerItem}
        onUpdateTask={updateTask as any}
        onDeleteTask={deleteTask as any}
        onArchiveTask={() => {}}
        onUnarchiveTask={() => {}}
        onMarkTrusted={handleDrawerTrusted}
        onSnooze={handleDrawerSnooze}
        onNoAction={handleDrawerNoAction}
        showLink={showLink}
      />

      <TriageCommitmentDrawer
        open={!!commitmentDrawerItem}
        onClose={closeAllDrawers}
        commitment={commitmentDrawerItem}
        onComplete={handleCommitmentComplete}
        onSnooze={handleDrawerSnooze}
        onDelegate={handleCommitmentDelegate}
        onMarkWaitingOn={handleCommitmentWaitingOn}
        onFollowUp={handleCommitmentFollowUp}
        onMarkBroken={handleCommitmentBroken}
        onCancel={handleCommitmentCancel}
      />

      <TriageEventModal
        event={eventModalItem}
        isOpen={!!eventModalItem}
        onClose={closeAllDrawers}
        onMarkTrusted={handleDrawerTrusted}
        onSnooze={handleDrawerSnooze}
        onNoAction={handleDrawerNoAction}
        showLink={showLink}
      />

      <TriageReadingSheet
        open={!!readingSheetItem}
        onClose={closeAllDrawers}
        item={readingSheetItem}
        onAdvance={advanceToNext}
        onSnooze={handleDrawerSnooze}
      />

      <TriageGenericSheet
        open={!!genericSheetItem}
        onClose={closeAllDrawers}
        item={genericSheetItem}
        onMarkTrusted={handleDrawerTrusted}
        onSnooze={handleDrawerSnooze}
        onNoAction={handleDrawerNoAction}
        showLink={showLink}
      />
    </motion.div>
  );
}
