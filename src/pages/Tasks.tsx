
import { useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTasksManager } from "@/hooks/useTasksManager";
import { QuickTaskInput } from "@/components/tasks/QuickTaskInput";
import { ViewModeToggle } from "@/components/tasks/ViewModeToggle";
import { TasksFilters } from "@/components/tasks/TasksFilters";
import { TasksMainContent } from "@/components/tasks/TasksMainContent";
import { QuickTasksPanel } from "@/components/tasks/QuickTasksPanel";

export default function Tasks() {
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const {
    tasks,
    handleAddTask,
    handleCompleteTask,
    handleDeleteTask,
    handleUpdateTaskStatus,
    handleUpdateTask
  } = useTasksManager();

  // Filter tasks into quick tasks and regular tasks
  const quickTasks = tasks.filter(task => task.is_quick_task);
  const regularTasks = tasks.filter(task => !task.is_quick_task);

  const handleAddQuickTask = (content: string) => {
    handleAddTask(content, true); // Create as quick task
  };

  const handleAddRegularTask = (content: string) => {
    handleAddTask(content, false); // Create as regular task
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Quick Add Input Bar */}
          <QuickTaskInput onAddTask={handleAddQuickTask} />

          {/* View Toggle */}
          <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />

          {/* Filters Row */}
          <TasksFilters
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            priorityFilter={priorityFilter}
            setPriorityFilter={setPriorityFilter}
          />

          {/* Main Content Layout */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Main Tasks (70% width) */}
            <TasksMainContent
              regularTasks={regularTasks}
              onAddTask={handleAddRegularTask}
              onTaskComplete={handleCompleteTask}
              onTaskDelete={handleDeleteTask}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onUpdateTask={handleUpdateTask}
            />

            {/* Right: Quick Tasks Panel (30% width) */}
            <QuickTasksPanel
              quickTasks={quickTasks}
              onTaskComplete={handleCompleteTask}
              onTaskDelete={handleDeleteTask}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
