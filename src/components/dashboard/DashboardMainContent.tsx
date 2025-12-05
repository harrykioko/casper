import { useState } from "react";
import { Task } from "@/hooks/useTasks";
import { ReadingItem } from "@/types/readingItem";

// Tiles
import { DashboardTopBar } from "./tiles/DashboardTopBar";
import { PriorityItemsTile } from "./tiles/PriorityItemsTile";
import { InboxTile } from "./tiles/InboxTile";
import { TodoListTile } from "./tiles/TodoListTile";
import { PortfolioGridTile } from "./tiles/PortfolioGridTile";
import { PipelineGridTile } from "./tiles/PipelineGridTile";
import { ReadingListTile } from "./tiles/ReadingListTile";
import { RecentNotesTile } from "./tiles/RecentNotesTile";

// Modals & Panes
import { CompanyCommandPane } from "@/components/command-pane/CompanyCommandPane";
import { EnhancedCommandModal } from "@/components/modals/EnhancedCommandModal";
import { CreateProjectModal } from "@/components/modals/CreateProjectModal";
import { CreatePromptModal } from "@/components/modals/CreatePromptModal";
import { AddLinkDialog } from "@/components/modals/AddLinkDialog";
import { AddTaskDialog } from "@/components/modals/AddTaskDialog";
import { TaskDetailsDialog } from "@/components/modals/TaskDetailsDialog";

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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false);
  
  // Command pane state
  const [commandPaneOpen, setCommandPaneOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'portfolio' | 'pipeline';
    id: string;
  } | null>(null);

  const handleCreatePrompt = (promptData: any) => {
    console.log('Creating prompt:', promptData);
    onNavigate('/prompts');
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDetailsOpen(true);
  };

  const handleTaskDetailsClose = () => {
    setIsTaskDetailsOpen(false);
    setSelectedTask(null);
  };

  const openPortfolioCommandPane = (companyId: string) => {
    setSelectedEntity({ type: 'portfolio', id: companyId });
    setCommandPaneOpen(true);
  };

  const openPipelineCommandPane = (companyId: string) => {
    setSelectedEntity({ type: 'pipeline', id: companyId });
    setCommandPaneOpen(true);
  };

  const openCommandPaneByEntityType = (companyId: string, entityType: 'portfolio' | 'pipeline') => {
    setSelectedEntity({ type: entityType, id: companyId });
    setCommandPaneOpen(true);
  };

  const closeCommandPane = () => {
    setCommandPaneOpen(false);
    setSelectedEntity(null);
  };

  return (
    <div className="flex-1 h-screen overflow-y-auto">
      <div className="px-8 lg:px-16 xl:px-20 py-8">
        {/* Top Bar */}
        <DashboardTopBar onCommandClick={openCommandModal} />

        {/* 12-Column Grid Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Row 1: Primary Work Zone */}
          <PriorityItemsTile onCompanyClick={openCommandPaneByEntityType} />
          <InboxTile />
          <TodoListTile onTaskClick={handleTaskClick} />

          {/* Row 2: Portfolio Grid */}
          <PortfolioGridTile onCompanyClick={openPortfolioCommandPane} />

          {/* Row 3: Pipeline Grid */}
          <PipelineGridTile onCompanyClick={openPipelineCommandPane} />

          {/* Row 4: Utility Zone */}
          <ReadingListTile onAddClick={() => setShowAddLink(true)} />
          <RecentNotesTile onCompanyClick={openCommandPaneByEntityType} />
        </div>
      </div>

      {/* Company Command Pane */}
      <CompanyCommandPane
        open={commandPaneOpen}
        onClose={closeCommandPane}
        entityType={selectedEntity?.type || 'portfolio'}
        entityId={selectedEntity?.id || null}
      />

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
        onCreatePrompt={handleCreatePrompt}
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

      {/* Task Details Modal */}
      <TaskDetailsDialog
        open={isTaskDetailsOpen}
        onOpenChange={handleTaskDetailsClose}
        task={selectedTask}
        onUpdateTask={onUpdateTask}
        onDeleteTask={onTaskDelete}
      />
    </div>
  );
}
