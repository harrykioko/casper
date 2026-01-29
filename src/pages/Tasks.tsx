
import { useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTasksManager } from "@/hooks/useTasksManager";
import { useCategories } from "@/hooks/useCategories";
import { useProjects } from "@/hooks/useProjects";
import { useTaskFiltering } from "@/hooks/useTaskFiltering";
import { Task } from "@/hooks/useTasks";
import { QuickTaskInput } from "@/components/tasks/QuickTaskInput";
import { ViewModeToggle } from "@/components/tasks/ViewModeToggle";
import { TasksFilters } from "@/components/tasks/TasksFilters";
import { TasksMainContent } from "@/components/tasks/TasksMainContent";
import { TasksKanbanView } from "@/components/tasks/TasksKanbanView";
import { InboxSection } from "@/components/tasks/InboxSection";
import { TaskDetailsDialog } from "@/components/modals/TaskDetailsDialog";

export default function Tasks() {
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false);
  const [showInbox, setShowInbox] = useState(false); // Triage section collapsed by default

  const {
    tasks,
    inboxTasks,
    nonInboxTasks,
    handleAddTask,
    handleCompleteTask,
    handleDeleteTask,
    handlePromoteTask,
    handleUpdateTaskStatus,
    handleUpdateTask,
    quickInlineUpdate,
    bulkUpdate
  } = useTasksManager();

  const { categories } = useCategories();
  const { projects } = useProjects();

  // Apply filtering to non-inbox tasks
  const filteredTasks = useTaskFiltering(nonInboxTasks, {
    statusFilter,
    priorityFilter,
    categoryFilter,
    projectFilter,
    sortBy,
    categories,
    projects
  });

  const handleAddTask_click = (content: string) => {
    handleAddTask(content); // All tasks go to inbox by default
  };

  const handleBulkAction = (ids: string[], action: string, value?: string | boolean) => {
    const patch: Record<string, string | boolean> = {};
    switch (action) {
      case 'schedule':
        if (typeof value === 'string') patch.scheduled_for = value;
        break;
      case 'project':
        if (typeof value === 'string') patch.project_id = value;
        break;
      case 'priority':
        if (typeof value === 'string') patch.priority = value;
        break;
      case 'complete':
        if (typeof value === 'boolean') {
          patch.completed = value;
          patch.status = 'done';
        }
        break;
    }
    bulkUpdate(ids, patch);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDetailsOpen(true);
  };

  const handleTaskDetailsClose = () => {
    setIsTaskDetailsOpen(false);
    setSelectedTask(null);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Quick Add Input Bar */}
          <QuickTaskInput onAddTask={handleAddTask_click} />

          {/* View Toggle */}
          <ViewModeToggle 
            viewMode={viewMode} 
            onViewModeChange={setViewMode}
            showInbox={showInbox}
            onShowInboxChange={setShowInbox}
          />

          {/* Filters Row */}
          <TasksFilters
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            priorityFilter={priorityFilter}
            setPriorityFilter={setPriorityFilter}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            projectFilter={projectFilter}
            setProjectFilter={setProjectFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />

          {/* Main Content Layout */}
          {viewMode === "list" ? (
            <div className="space-y-6">
              {/* Triage Section - Show when triage toggle is active */}
              {showInbox && (
                <InboxSection
                  tasks={inboxTasks}
                  onInlineUpdate={quickInlineUpdate}
                  onBulkAction={handleBulkAction}
                  onTaskComplete={handleCompleteTask}
                  onTaskClick={handleTaskClick}
                  onPromoteTask={handlePromoteTask}
                />
              )}

              {/* Main Tasks */}
              <TasksMainContent
                regularTasks={filteredTasks}
                onTaskComplete={handleCompleteTask}
                onTaskDelete={handleDeleteTask}
                onUpdateTaskStatus={handleUpdateTaskStatus}
                onUpdateTask={handleUpdateTask}
                onTaskClick={handleTaskClick}
              />
            </div>
          ) : (
            <div className="w-full">
              {/* Kanban Board with Triage Column */}
              <TasksKanbanView
                tasks={filteredTasks}
                inboxTasks={showInbox ? inboxTasks : []}
                onTaskComplete={handleCompleteTask}
                onTaskDelete={handleDeleteTask}
                onUpdateTaskStatus={handleUpdateTaskStatus}
                onTaskClick={handleTaskClick}
              />
            </div>
          )}

          {/* Task Details Modal */}
          <TaskDetailsDialog
            open={isTaskDetailsOpen}
            onOpenChange={handleTaskDetailsClose}
            task={selectedTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
