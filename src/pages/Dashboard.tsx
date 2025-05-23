
import { useNavigate } from "react-router-dom";
import { CommandModal } from "@/components/modals/CommandModal";
import { CalendarSidebar } from "@/components/dashboard/CalendarSidebar";
import { DashboardMainContent } from "@/components/dashboard/DashboardMainContent";
import { useTasksManager } from "@/hooks/useTasksManager";
import { useReadingItemsManager } from "@/hooks/useReadingItemsManager";
import { useCommandModal } from "@/hooks/useCommandModal";
import { useDashboardKeyboardShortcuts } from "@/hooks/useDashboardKeyboardShortcuts";
import { mockEvents } from "@/data/mockData";
import { useState } from "react";
import { AddLinkDialog } from "@/components/modals/AddLinkDialog";
import { AddTaskDialog } from "@/components/modals/AddTaskDialog";
import { CreateProjectModal } from "@/components/modals/CreateProjectModal";

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Use custom hooks to manage state and handlers
  const { tasks, handleAddTask, handleCompleteTask, handleDeleteTask, handleUpdateTaskStatus, handleUpdateTask } = useTasksManager();
  const { readingItems, handleMarkRead, handleDeleteReadingItem, handleAddReadingItem } = useReadingItemsManager();
  const { isCommandModalOpen, openCommandModal, closeCommandModal } = useCommandModal();
  const [addLinkDialogOpen, setAddLinkDialogOpen] = useState(false);
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  
  // Set up keyboard shortcuts
  useDashboardKeyboardShortcuts({ openCommandModal });
  
  // Handle navigation to prompts page for new prompt
  const handleAddPrompt = () => {
    navigate('/prompts', { state: { openNewPrompt: true } });
  };

  // Handle project creation
  const handleCreateProject = (data: any) => {
    console.log('Creating project from dashboard:', data);
    // Here you would typically call an API or add to state
    navigate('/projects');
  };
  
  return (
    <div className="min-h-screen" tabIndex={0}>
      <div className="flex">
        {/* Main Content Column */}
        <DashboardMainContent 
          tasks={tasks}
          readingItems={readingItems}
          openCommandModal={openCommandModal}
          onAddTask={handleAddTask}
          onTaskComplete={handleCompleteTask}
          onTaskDelete={handleDeleteTask}
          onUpdateTaskStatus={handleUpdateTaskStatus}
          onUpdateTask={handleUpdateTask}
          onMarkRead={handleMarkRead}
          onDeleteReadingItem={handleDeleteReadingItem}
          onAddReadingItem={handleAddReadingItem}
        />
        
        {/* Right Sidebar - Calendar and Upcoming */}
        <CalendarSidebar events={mockEvents} />
      </div>
      
      {/* Command Modal */}
      <CommandModal 
        isOpen={isCommandModalOpen} 
        onClose={closeCommandModal} 
        onAddTask={() => setAddTaskDialogOpen(true)}
        onNavigate={navigate}
        onAddLink={() => setAddLinkDialogOpen(true)}
        onAddPrompt={handleAddPrompt}
        onAddProject={() => setCreateProjectModalOpen(true)}
      />

      {/* Add Link Dialog */}
      <AddLinkDialog
        open={addLinkDialogOpen}
        onOpenChange={setAddLinkDialogOpen}
        onAddLink={handleAddReadingItem}
      />

      {/* Add Task Dialog */}
      <AddTaskDialog
        open={addTaskDialogOpen}
        onOpenChange={setAddTaskDialogOpen}
        onAddTask={handleAddTask}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        open={createProjectModalOpen}
        onOpenChange={setCreateProjectModalOpen}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
}
