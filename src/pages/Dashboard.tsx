
import { useNavigate } from "react-router-dom";
import { CommandModal } from "@/components/modals/CommandModal";
import { CalendarSidebar } from "@/components/dashboard/CalendarSidebar";
import { DashboardMainContent } from "@/components/dashboard/DashboardMainContent";
import { useTasks } from "@/hooks/useTasks";
import { useReadingItems } from "@/hooks/useReadingItems";
import { useNonnegotiables } from "@/hooks/useNonnegotiables";
import { useCommandModal } from "@/hooks/useCommandModal";
import { useDashboardKeyboardShortcuts } from "@/hooks/useDashboardKeyboardShortcuts";
import { mockEvents } from "@/data/mockData";
import { useState } from "react";
import { AddLinkDialog } from "@/components/modals/AddLinkDialog";
import { AddTaskDialog } from "@/components/modals/AddTaskDialog";
import { CreateProjectModal } from "@/components/modals/CreateProjectModal";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Use live data hooks instead of mock data
  const { tasks, loading: tasksLoading, createTask, updateTask, deleteTask } = useTasks();
  const { readingItems, loading: readingLoading, createReadingItem, updateReadingItem, deleteReadingItem } = useReadingItems();
  const { nonnegotiables, loading: nonnegotiablesLoading } = useNonnegotiables();
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
    navigate('/projects');
  };

  // Task handlers
  const handleAddTask = async (content: string) => {
    try {
      await createTask({ content });
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleCompleteTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      try {
        await updateTask(id, { 
          completed: !task.completed,
          status: !task.completed ? 'done' : 'todo'
        });
      } catch (error) {
        console.error('Failed to update task:', error);
      }
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask(id);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleUpdateTaskStatus = async (id: string, status: "todo" | "inprogress" | "done") => {
    try {
      await updateTask(id, { 
        status,
        completed: status === 'done'
      });
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleUpdateTask = async (updatedTask: any) => {
    try {
      await updateTask(updatedTask.id, updatedTask);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  // Reading list handlers
  const handleMarkRead = async (id: string) => {
    const item = readingItems.find(item => item.id === id);
    if (item) {
      try {
        await updateReadingItem(id, { is_read: !item.isRead });
      } catch (error) {
        console.error('Failed to update reading item:', error);
      }
    }
  };

  const handleDeleteReadingItem = async (id: string) => {
    try {
      await deleteReadingItem(id);
    } catch (error) {
      console.error('Failed to delete reading item:', error);
    }
  };

  const handleAddReadingItem = async (itemData: any) => {
    try {
      await createReadingItem(itemData);
    } catch (error) {
      console.error('Failed to create reading item:', error);
    }
  };

  // Show loading skeleton while data is loading
  if (tasksLoading || readingLoading || nonnegotiablesLoading) {
    return (
      <div className="min-h-screen" tabIndex={0}>
        <div className="flex">
          <div className="flex-1 p-8">
            <div className="max-w-3xl mx-auto space-y-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
          <CalendarSidebar events={mockEvents} nonnegotiables={[]} />
        </div>
      </div>
    );
  }

  // Transform nonnegotiables data to match the expected format
  const transformedNonnegotiables = nonnegotiables.map(item => ({
    id: item.id,
    label: item.title, // Transform title to label
    streak: undefined // We don't have streak data in the database yet
  }));
  
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
        <CalendarSidebar events={mockEvents} nonnegotiables={transformedNonnegotiables} />
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
