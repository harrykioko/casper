import { useState } from "react";
import { Task } from "@/hooks/useTasks";
import { ReadingItem } from "@/types/readingItem";
import { DashboardHeroBand } from "@/components/dashboard/DashboardHeroBand";
import { TodayTasksSection } from "@/components/dashboard/TodayTasksSection";
import { ReadingListSection } from "@/components/dashboard/ReadingListSection";
import { TaskInput } from "@/components/dashboard/TaskInput";
import { DashboardPortfolioSection } from "@/components/dashboard/DashboardPortfolioSection";
import { DashboardPipelineFocusSection } from "@/components/dashboard/DashboardPipelineFocusSection";
import { DashboardPrioritySection } from "@/components/dashboard/DashboardPrioritySection";
import { InboxPlaceholder } from "@/components/dashboard/InboxPlaceholder";
import { RecentNotesSection } from "@/components/dashboard/RecentNotesSection";
import { CompanyCommandPane } from "@/components/command-pane/CompanyCommandPane";
import { EnhancedCommandModal } from "@/components/modals/EnhancedCommandModal";
import { CreateProjectModal } from "@/components/modals/CreateProjectModal";
import { CreatePromptModal } from "@/components/modals/CreatePromptModal";
import { AddLinkDialog } from "@/components/modals/AddLinkDialog";
import { AddTaskDialog } from "@/components/modals/AddTaskDialog";
import { TaskDetailsDialog } from "@/components/modals/TaskDetailsDialog";
import { GlassPanel, GlassPanelHeader } from "@/components/ui/glass-panel";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();
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

  const userName = user?.user_metadata?.full_name || user?.email;

  return (
    <div className="flex-1 overflow-auto">
      {/* Hero Header Band */}
      <DashboardHeroBand 
        userName={userName} 
        onCommandClick={openCommandModal} 
      />

      {/* Main Grid Content */}
      <div className="px-8 lg:px-12 xl:px-16 pb-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Row 1: Priority Items, Inbox, To-Do */}
          <div className="grid grid-cols-12 gap-6 mb-8">
            {/* Priority Items - 4 columns */}
            <div className="col-span-12 lg:col-span-4">
              <DashboardPrioritySection onCompanyClick={openCommandPaneByEntityType} />
            </div>
            
            {/* Inbox Placeholder - 4 columns */}
            <div className="col-span-12 lg:col-span-4">
              <InboxPlaceholder />
            </div>
            
            {/* To-Do List - 4 columns */}
            <div className="col-span-12 lg:col-span-4">
              <GlassPanel className="h-full">
                <GlassPanelHeader title="To-Do" />
                <TaskInput onAddTask={onAddTask} variant="glass" />
                <div className="mt-4 max-h-[280px] overflow-auto scrollbar-none">
                  <TodayTasksSection
                    tasks={tasks}
                    onTaskComplete={onTaskComplete}
                    onTaskDelete={onTaskDelete}
                    onTaskClick={handleTaskClick}
                    compact
                  />
                </div>
              </GlassPanel>
            </div>
          </div>

          {/* Row 2: Portfolio Grid */}
          <div className="mb-8">
            <DashboardPortfolioSection onCompanyClick={openPortfolioCommandPane} />
          </div>

          {/* Row 3: Pipeline Focus */}
          <div className="mb-8">
            <DashboardPipelineFocusSection onCompanyClick={openPipelineCommandPane} />
          </div>

          {/* Row 4: Reading List & Recent Notes */}
          <div className="grid grid-cols-12 gap-6">
            {/* Reading List - 6 columns */}
            <div className="col-span-12 lg:col-span-6">
              <ReadingListSection
                readingItems={readingItems}
                onMarkRead={onMarkRead}
                onDeleteReadingItem={onDeleteReadingItem}
                onAddReadingItem={onAddReadingItem}
              />
            </div>
            
            {/* Recent Notes - 6 columns */}
            <div className="col-span-12 lg:col-span-6">
              <RecentNotesSection />
            </div>
          </div>
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
