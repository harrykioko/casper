
import { useState } from "react";
import { TaskInput } from "@/components/dashboard/TaskInput";
import { TaskList, Task } from "@/components/dashboard/TaskList";
import { KanbanView } from "@/components/dashboard/KanbanView";
import { ListFilter, Columns } from "lucide-react";
import { Button } from "@/components/ui/button";

type ViewMode = "list" | "kanban";

interface TaskSectionProps {
  tasks: Task[];
  onAddTask: (content: string) => void;
  onTaskComplete: (id: string) => void;
  onTaskDelete: (id: string) => void;
}

export function TaskSection({ 
  tasks, 
  onAddTask, 
  onTaskComplete, 
  onTaskDelete 
}: TaskSectionProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Toggle between list and kanban views
  const toggleViewMode = (mode: ViewMode) => {
    setViewMode(mode);
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
        <Button
          variant={viewMode === "list" ? "default" : "outline"}
          size="sm"
          className={`h-8 w-8 p-0 ${viewMode === "list" ? 'bg-gradient-to-r from-[#FF6A79] to-[#415AFF] hover:from-[#FF6A79] hover:to-[#415AFF]' : ''}`}
          onClick={() => toggleViewMode("list")}
        >
          <ListFilter className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === "kanban" ? "default" : "outline"}
          size="sm"
          className={`h-8 w-8 p-0 ${viewMode === "kanban" ? 'bg-gradient-to-r from-[#FF6A79] to-[#415AFF] hover:from-[#FF6A79] hover:to-[#415AFF]' : ''}`}
          onClick={() => toggleViewMode("kanban")}
        >
          <Columns className="h-4 w-4" />
        </Button>
      </div>

      {/* Task Display (List or Kanban) */}
      <div className="mb-8">
        {viewMode === "list" ? (
          <TaskList 
            tasks={tasks} 
            onTaskComplete={onTaskComplete} 
            onTaskDelete={onTaskDelete} 
          />
        ) : (
          <KanbanView 
            tasks={tasks} 
            onTaskComplete={onTaskComplete} 
            onTaskDelete={onTaskDelete} 
          />
        )}
      </div>
    </>
  );
}
