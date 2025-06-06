
import { useState } from "react";
import { TaskInput } from "@/components/dashboard/TaskInput";
import { TaskList } from "@/components/dashboard/TaskList";
import { KanbanView } from "@/components/dashboard/KanbanView";
import { ListFilter, Columns } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TaskDetailsDialog } from "@/components/modals/TaskDetailsDialog";
import { Task } from "@/hooks/useTasks";

type ViewMode = "list" | "kanban";

interface TaskSectionProps {
  tasks: Task[];
  onAddTask: (content: string) => void;
  onTaskComplete: (id: string) => void;
  onTaskDelete: (id: string) => void;
  onUpdateTaskStatus: (id: string, status: "todo" | "inprogress" | "done") => void;
  onUpdateTask: (task: Task) => void;
}

export function TaskSection({ 
  tasks, 
  onAddTask, 
  onTaskComplete, 
  onTaskDelete,
  onUpdateTaskStatus,
  onUpdateTask
}: TaskSectionProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDetailsOpen, setTaskDetailsOpen] = useState(false);

  // Toggle between list and kanban views
  const toggleViewMode = (mode: ViewMode) => {
    setViewMode(mode);
  };

  // Handler for opening the task details modal
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskDetailsOpen(true);
  };

  // Handler for updating a task - now uses the real update function
  const handleUpdateTask = (updatedTask: Task) => {
    onUpdateTask(updatedTask);
  };

  return (
    <>
      {/* Task Entry */}
      <div className="mb-6">
        <TaskInput onAddTask={onAddTask} />
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-end items-center mb-4 gap-2">
        <span className="text-sm text-zinc-500 dark:text-white/60 mr-2">View:</span>
        <TooltipProvider>
          <div className="glassmorphic rounded-md p-0.5">
            <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as ViewMode)}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem 
                    value="list" 
                    className={`h-8 w-8 p-0 rounded-md hover:shadow-sm ring-1 ring-white/10 ${
                      viewMode === "list" 
                        ? 'bg-gradient-to-r from-[#FF6A79] to-[#415AFF]' 
                        : 'bg-transparent'
                    }`}
                  >
                    <ListFilter className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>
                  <p>List View</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem 
                    value="kanban" 
                    className={`h-8 w-8 p-0 rounded-md hover:shadow-sm ring-1 ring-white/10 ${
                      viewMode === "kanban" 
                        ? 'bg-gradient-to-r from-[#FF6A79] to-[#415AFF]' 
                        : 'bg-transparent'
                    }`}
                  >
                    <Columns className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Kanban View</p>
                </TooltipContent>
              </Tooltip>
            </ToggleGroup>
          </div>
        </TooltipProvider>
      </div>

      {/* Task Display (List or Kanban) */}
      <div className="mb-8">
        {viewMode === "list" ? (
          <TaskList 
            tasks={tasks} 
            onTaskComplete={onTaskComplete} 
            onTaskDelete={onTaskDelete}
            onTaskClick={handleTaskClick}
          />
        ) : (
          <KanbanView 
            tasks={tasks} 
            onTaskComplete={onTaskComplete} 
            onTaskDelete={onTaskDelete}
            onUpdateTaskStatus={onUpdateTaskStatus}
            onTaskClick={handleTaskClick}
          />
        )}
      </div>

      {/* Task Details Dialog */}
      <TaskDetailsDialog
        open={taskDetailsOpen}
        onOpenChange={setTaskDetailsOpen}
        task={selectedTask}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={onTaskDelete}
      />
    </>
  );
}
