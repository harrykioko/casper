import { useState, useMemo, useRef } from "react";
import { SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useTasksManager } from "@/hooks/useTasksManager";
import { useCategories } from "@/hooks/useCategories";
import { useProjects } from "@/hooks/useProjects";
import { useTaskFiltering } from "@/hooks/useTaskFiltering";
import { useIsDesktop } from "@/hooks/use-mobile";
import { Task } from "@/hooks/useTasks";
import { QuickTaskInput } from "@/components/tasks/QuickTaskInput";
import { TasksFilters } from "@/components/tasks/TasksFilters";
import { TasksMainContent } from "@/components/tasks/TasksMainContent";
import { TasksKanbanView } from "@/components/tasks/TasksKanbanView";
import { InboxSection } from "@/components/tasks/InboxSection";
import { TaskDetailsDialog } from "@/components/modals/TaskDetailsDialog";
import { TasksSummaryPanel } from "@/components/tasks/TasksSummaryPanel";
import { TasksPageHeader } from "@/components/tasks/TasksPageHeader";
import { cn } from "@/lib/utils";

export default function Tasks() {
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [statusFilter, setStatusFilter] = useState("ready"); // Default to "Ready to Work"
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  const quickInputRef = useRef<HTMLInputElement>(null);

  const isDesktop = useIsDesktop();

  const {
    tasks,
    inboxTasks,
    nonInboxTasks,
    archivedTasks,
    handleAddTask,
    handleCompleteTask,
    handleDeleteTask,
    handlePromoteTask,
    handleUpdateTaskStatus,
    handleUpdateTask,
    quickInlineUpdate,
    bulkUpdate,
    handleArchiveTask,
    handleUnarchiveTask,
  } = useTasksManager();

  const { categories } = useCategories();
  const { projects } = useProjects();

  // Combine non-inbox + archived when showArchived is toggled
  const visibleTasks = useMemo(() => {
    if (showArchived) return [...nonInboxTasks, ...archivedTasks];
    return nonInboxTasks;
  }, [nonInboxTasks, archivedTasks, showArchived]);

  // Filter by search query first
  const searchedTasks = useMemo(() => {
    if (!searchQuery.trim()) return visibleTasks;
    const q = searchQuery.toLowerCase();
    return visibleTasks.filter(t => t.content.toLowerCase().includes(q));
  }, [visibleTasks, searchQuery]);

  // Apply filtering to searched tasks
  const filteredTasks = useTaskFiltering(searchedTasks, {
    statusFilter,
    priorityFilter,
    categoryFilter,
    projectFilter,
    sortBy,
    categories,
    projects
  });

  const handleAddTask_click = (content: string) => {
    handleAddTask(content);
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

  const handleAddTaskFocus = () => {
    quickInputRef.current?.focus();
  };

  const gridClasses = cn(
    "grid gap-6",
    isDesktop
      ? "grid-cols-[260px_minmax(0,1fr)] 2xl:grid-cols-[280px_1fr]"
      : "grid-cols-1"
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Session Header */}
          <TasksPageHeader 
            tasks={nonInboxTasks} 
            onAddTaskClick={handleAddTaskFocus}
          />

          {/* Mobile filters toggle */}
          {!isDesktop && (
            <div className="flex items-center justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className={showMobileFilters ? "bg-accent" : ""}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          )}

          {/* Mobile collapsible filters */}
          {!isDesktop && showMobileFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
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
            </motion.div>
          )}

          {/* 2-column grid layout */}
          <div className={gridClasses}>
            {/* Left: Summary Panel (desktop only) */}
            {isDesktop && (
              <div className="hidden lg:block">
                <TasksSummaryPanel
                  tasks={nonInboxTasks}
                  triageCount={inboxTasks.length}
                  archivedCount={archivedTasks.length}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  priorityFilter={priorityFilter}
                  onPriorityFilterChange={setPriorityFilter}
                  categoryFilter={categoryFilter}
                  onCategoryFilterChange={setCategoryFilter}
                  projectFilter={projectFilter}
                  onProjectFilterChange={setProjectFilter}
                  sortBy={sortBy}
                  onSortByChange={setSortBy}
                  searchQuery={searchQuery}
                  onSearchQueryChange={setSearchQuery}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  showTriage={showInbox}
                  onShowTriageChange={setShowInbox}
                  showArchived={showArchived}
                  onShowArchivedChange={setShowArchived}
                />
              </div>
            )}

            {/* Right: Main content */}
            <div className="space-y-5">
              {/* Quick Add Input Bar */}
              <QuickTaskInput onAddTask={handleAddTask_click} />

              {/* Main Content */}
              {viewMode === "list" ? (
                <div className="space-y-6">
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
            </div>
          </div>

          {/* Task Details Modal */}
          <TaskDetailsDialog
            open={isTaskDetailsOpen}
            onOpenChange={handleTaskDetailsClose}
            task={selectedTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onArchiveTask={handleArchiveTask}
            onUnarchiveTask={handleUnarchiveTask}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
