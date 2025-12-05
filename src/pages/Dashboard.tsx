
import { useNavigate } from "react-router-dom";
import { CalendarSidebar } from "@/components/dashboard/CalendarSidebar";
import { DashboardMainContent } from "@/components/dashboard/DashboardMainContent";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";
import { DashboardDialogs } from "@/components/dashboard/DashboardDialogs";
import { useTasks } from "@/hooks/useTasks";
import { useReadingItems } from "@/hooks/useReadingItems";
import { useNonnegotiables } from "@/hooks/useNonnegotiables";
import { useOutlookCalendar } from "@/hooks/useOutlookCalendar";
import { useCommandModal } from "@/hooks/useCommandModal";
import { useDashboardHandlers } from "@/hooks/useDashboardHandlers";
import { useState } from "react";

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Use live data hooks instead of mock data
  const { tasks, loading: tasksLoading, createTask, updateTask, deleteTask } = useTasks();
  const { readingItems, loading: readingLoading, createReadingItem, updateReadingItem, deleteReadingItem } = useReadingItems();
  const { nonnegotiables, loading: nonnegotiablesLoading } = useNonnegotiables();
  const { events: calendarEvents } = useOutlookCalendar();
  const { isCommandModalOpen, openCommandModal, closeCommandModal } = useCommandModal();
  
  // Modal state
  const [addLinkDialogOpen, setAddLinkDialogOpen] = useState(false);
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  
  // Get all handlers
  const handlers = useDashboardHandlers({
    tasks,
    createTask,
    updateTask,
    deleteTask,
    readingItems,
    createReadingItem,
    updateReadingItem,
    deleteReadingItem,
  });

  // Show loading skeleton while data is loading
  if (tasksLoading || readingLoading || nonnegotiablesLoading) {
    return <DashboardLoading />;
  }

  // Transform nonnegotiables data to match the expected format
  const transformedNonnegotiables = nonnegotiables.map(item => ({
    id: item.id,
    label: item.title,
    streak: undefined
  }));
  
  return (
    <div className="min-h-screen" tabIndex={0}>
      {/* CSS Grid ensures calendar sidebar always has reserved space */}
      <div className="grid grid-cols-[1fr_320px] min-h-screen">
        {/* Main Content Column */}
        <DashboardMainContent 
          className="overflow-x-hidden overflow-y-auto"
          tasks={tasks}
          readingItems={readingItems}
          openCommandModal={openCommandModal}
          onAddTask={handlers.handleAddTask}
          onTaskComplete={handlers.handleCompleteTask}
          onTaskDelete={handlers.handleDeleteTask}
          onUpdateTaskStatus={handlers.handleUpdateTaskStatus}
          onUpdateTask={handlers.handleUpdateTask}
          onMarkRead={handlers.handleMarkRead}
          onDeleteReadingItem={handlers.handleDeleteReadingItem}
          onAddReadingItem={handlers.handleAddReadingItem}
          isCommandModalOpen={isCommandModalOpen}
          closeCommandModal={closeCommandModal}
          onNavigate={navigate}
        />
        
        {/* Right Sidebar - Calendar (grid reserves 320px) */}
        <CalendarSidebar 
          events={calendarEvents} 
          nonnegotiables={transformedNonnegotiables} 
        />
      </div>

      {/* Dialogs */}
      <DashboardDialogs
        addLinkDialogOpen={addLinkDialogOpen}
        setAddLinkDialogOpen={setAddLinkDialogOpen}
        addTaskDialogOpen={addTaskDialogOpen}
        setAddTaskDialogOpen={setAddTaskDialogOpen}
        createProjectModalOpen={createProjectModalOpen}
        setCreateProjectModalOpen={setCreateProjectModalOpen}
        onAddReadingItem={handlers.handleAddReadingItem}
        onAddTask={handlers.handleAddTask}
        onCreateProject={handlers.handleCreateProject}
      />
    </div>
  );
}
