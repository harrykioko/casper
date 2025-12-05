import { useState } from "react";
import { Plus, CheckCircle2 } from "lucide-react";
import { Task } from "@/hooks/useTasks";
import { ReadingItem } from "@/types/readingItem";
import { TaskPrefillOptions } from "@/types/inbox";
import { DashboardHeroBand } from "@/components/dashboard/DashboardHeroBand";
import { TodayTasksSection } from "@/components/dashboard/TodayTasksSection";
import { ReadingListSection } from "@/components/dashboard/ReadingListSection";
import { TaskInput } from "@/components/dashboard/TaskInput";
import { DashboardPortfolioSection } from "@/components/dashboard/DashboardPortfolioSection";
import { DashboardPipelineFocusSection } from "@/components/dashboard/DashboardPipelineFocusSection";
import { DashboardPrioritySection } from "@/components/dashboard/DashboardPrioritySection";
import { InboxPanel } from "@/components/dashboard/InboxPanel";
import { RecentNotesSection } from "@/components/dashboard/RecentNotesSection";
import { CompanyCommandPane } from "@/components/command-pane/CompanyCommandPane";
import { EnhancedCommandModal } from "@/components/modals/EnhancedCommandModal";
import { CreateProjectModal } from "@/components/modals/CreateProjectModal";
import { CreatePromptModal } from "@/components/modals/CreatePromptModal";
import { AddLinkDialog } from "@/components/modals/AddLinkDialog";
import { AddTaskDialog } from "@/components/modals/AddTaskDialog";
import { TaskDetailsDialog } from "@/components/modals/TaskDetailsDialog";
import {
  ActionPanel,
  ActionPanelHeader,
  ActionPanelListArea,
  ActionPanelFooter,
} from "@/components/ui/action-panel";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePriorityItems } from "@/hooks/usePriorityItems";
import { useUserProfile } from "@/hooks/useUserProfile";
import { cn } from "@/lib/utils";

interface DashboardMainContentProps {
  className?: string;
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
  className,
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
  const { profile } = useUserProfile();
  const { totalCount: priorityCount } = usePriorityItems();
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreatePrompt, setShowCreatePrompt] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskPrefill, setTaskPrefill] = useState<TaskPrefillOptions | undefined>(undefined);
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

  // Handler for opening task creation with prefill
  const handleOpenTaskCreate = (options?: TaskPrefillOptions) => {
    setTaskPrefill(options);
    setShowAddTask(true);
  };

  // Reset prefill when dialog closes
  const handleAddTaskOpenChange = (open: boolean) => {
    setShowAddTask(open);
    if (!open) {
      setTaskPrefill(undefined);
    }
  };

  const userName = profile?.full_name || user?.email;
  
  // Calculate counts for hero band and To-Do panel
  const completedToday = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const todoCount = tasks.filter(t => !t.completed).length;
  const inboxCount = 3; // Mock inbox count

  return (
    <div className={cn("min-w-0", className)}>
      {/* Hero Header Band */}
      <DashboardHeroBand 
        userName={userName} 
        onCommandClick={openCommandModal}
        priorityCount={priorityCount}
        inboxCount={inboxCount}
        todoCount={todoCount}
      />

      {/* Main Grid Content */}
      <div className="px-4 sm:px-6 lg:px-8 pb-8">
          
        {/* Row 1: Priority Items, Inbox, To-Do */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          <DashboardPrioritySection 
            onCompanyClick={openCommandPaneByEntityType}
            onOpenTaskCreate={handleOpenTaskCreate}
          />
          <InboxPanel onOpenTaskCreate={handleOpenTaskCreate} />
          
          {/* To-Do Panel with ActionPanel */}
          <ActionPanel accentColor="emerald" className="h-full">
            <ActionPanelHeader
              icon={<CheckCircle2 className="h-4 w-4" />}
              title="To-Do"
              subtitle={`${completedToday}/${totalTasks} done today`}
              badge={
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full px-4 h-7 text-[11px] font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
                  onClick={() => handleOpenTaskCreate()}
                >
                  <Plus className="mr-1 h-3 w-3" /> New task
                </Button>
              }
              accentColor="emerald"
            />
            
            <ActionPanelListArea accentColor="emerald" className="overflow-y-auto max-h-[280px]">
              <TaskInput onAddTask={onAddTask} variant="glass" />
              <div className="mt-2">
                <TodayTasksSection
                  tasks={tasks}
                  onTaskComplete={onTaskComplete}
                  onTaskDelete={onTaskDelete}
                  onTaskClick={handleTaskClick}
                  onUpdateTask={onUpdateTask}
                  compact
                />
              </div>
            </ActionPanelListArea>

            <ActionPanelFooter className="justify-end">
              <button 
                onClick={() => onNavigate('/tasks')}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                View all tasks
              </button>
            </ActionPanelFooter>
          </ActionPanel>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ReadingListSection
            readingItems={readingItems}
            onMarkRead={onMarkRead}
            onDeleteReadingItem={onDeleteReadingItem}
            onAddReadingItem={onAddReadingItem}
          />
          <RecentNotesSection />
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
        onAddTask={() => handleOpenTaskCreate()}
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
        onOpenChange={handleAddTaskOpenChange}
        onAddTask={onAddTask}
        prefill={taskPrefill}
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
