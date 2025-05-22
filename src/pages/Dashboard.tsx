
import { useNavigate } from "react-router-dom";
import { CommandModal } from "@/components/modals/CommandModal";
import { CalendarSidebar } from "@/components/dashboard/CalendarSidebar";
import { DashboardMainContent } from "@/components/dashboard/DashboardMainContent";
import { useTasksManager } from "@/hooks/useTasksManager";
import { useReadingItemsManager } from "@/hooks/useReadingItemsManager";
import { useCommandModal } from "@/hooks/useCommandModal";
import { useDashboardKeyboardShortcuts } from "@/hooks/useDashboardKeyboardShortcuts";
import { mockEvents } from "@/data/mockData";

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Use custom hooks to manage state and handlers
  const { tasks, handleAddTask, handleCompleteTask, handleDeleteTask, handleUpdateTaskStatus } = useTasksManager();
  const { readingItems, handleMarkRead, handleDeleteReadingItem } = useReadingItemsManager();
  const { isCommandModalOpen, openCommandModal, closeCommandModal } = useCommandModal();
  
  // Set up keyboard shortcuts
  useDashboardKeyboardShortcuts({ openCommandModal });
  
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
          onMarkRead={handleMarkRead}
          onDeleteReadingItem={handleDeleteReadingItem}
        />
        
        {/* Right Sidebar - Calendar and Upcoming */}
        <CalendarSidebar events={mockEvents} />
      </div>
      
      {/* Command Modal */}
      <CommandModal 
        isOpen={isCommandModalOpen} 
        onClose={closeCommandModal} 
        onAddTask={handleAddTask}
        onNavigate={navigate}
      />
    </div>
  );
}
