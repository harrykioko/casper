import { useState } from "react";
import { Task } from "@/hooks/useTasks";
import { ReadingItem } from "@/types/readingItem";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { TaskSection } from "@/components/dashboard/TaskSection";
import { ReadingListSection } from "@/components/dashboard/ReadingListSection";
import { EnhancedCommandModal } from "@/components/modals/EnhancedCommandModal";
import { CreateProjectModal } from "@/components/modals/CreateProjectModal";
import { CreatePromptModal } from "@/components/modals/CreatePromptModal";
import { AddLinkDialog } from "@/components/modals/AddLinkDialog";
import { AddTaskDialog } from "@/components/modals/AddTaskDialog";

interface DashboardMainContentProps {
  tasks: Task[];
  readingItems: ReadingItem[];
  openCommandModal: () => void;
  onAddTask: (content: string) => void;
  onTaskComplete: (id: string) => void;
  onTaskDelete: (id: string) => void;
  onUpdateTaskStatus: (id: string, status: "todo" | "inprogress" | "done") => void;
  onUpdateTask: (task: Task) => void;
  onMarkRead: (id: string) => void;
  onDeleteReadingItem: (id: string) => void;
  onAddReadingItem: (item: Omit<ReadingItem, 'id'>) => void;
  isCommandModalOpen: boolean;
  closeCommandModal: () => void;
  onNavigate: (path: string) => void;
}

export function DashboardMainContent({
  tasks,
  readingItems,
  openCommandModal,
  onAddTask,
  onTaskComplete,
  onTaskDelete,
  onUpdateTaskStatus,
  onUpdateTask,
  onMarkRead,
  onDeleteReadingItem,
  onAddReadingItem,
  isCommandModalOpen,
  closeCommandModal,
  onNavigate
}: DashboardMainContentProps) {
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreatePrompt, setShowCreatePrompt] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);

  return (
    <div className="flex-1 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header with Command Button */}
        <DashboardHeader openCommandModal={openCommandModal} />

        {/* Task Section */}
        <TaskSection
          tasks={tasks}
          onAddTask={onAddTask}
          onTaskComplete={onTaskComplete}
          onTaskDelete={onTaskDelete}
          onUpdateTaskStatus={onUpdateTaskStatus}
        />

        {/* Reading List Section */}
        <ReadingListSection
          readingItems={readingItems}
          onMarkRead={onMarkRead}
          onDeleteReadingItem={onDeleteReadingItem}
          onAddReadingItem={onAddReadingItem}
        />
      </div>

      {/* Enhanced Command Modal */}
      <EnhancedCommandModal
        isOpen={isCommandModalOpen}
        onClose={closeCommandModal}
        onNavigate={onNavigate}
        onAddTask={() => setShowAddTask(true)}
        onAddProject={() => setShowCreateProject(true)}
        onAddPrompt={() => setShowCreatePrompt(true)}
        onAddLink={() => setShowAddLink(true)}
      />

      {/* Action Modals */}
      <CreateProjectModal 
        open={showCreateProject} 
        onOpenChange={setShowCreateProject} 
      />
      
      <CreatePromptModal 
        open={showCreatePrompt} 
        onOpenChange={setShowCreatePrompt} 
      />
      
      <AddLinkDialog 
        open={showAddLink} 
        onOpenChange={setShowAddLink}
        onAddLink={onAddReadingItem}
      />
      
      <AddTaskDialog 
        open={showAddTask} 
        onOpenChange={setShowAddTask}
        onAddTask={onAddTask}
      />
    </div>
  );
}
