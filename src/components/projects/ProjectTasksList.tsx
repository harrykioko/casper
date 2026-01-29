import { useState } from "react";
import { CheckSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/hooks/useTasks";
import { AddTaskDialog } from "@/components/modals/AddTaskDialog";
import { GlassModuleCard } from "./GlassModuleCard";
import { ProjectEmptyState } from "./ProjectEmptyState";
import { cn } from "@/lib/utils";

interface ProjectTasksListProps {
  tasks: Task[];
  onAddTask?: (taskContent: string) => void;
}

export function ProjectTasksList({ tasks, onAddTask }: ProjectTasksListProps) {
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  
  const getBadgeColorForSchedule = (scheduledFor: string) => {
    if (scheduledFor === 'Today') return 'bg-indigo-500/10 text-indigo-500 border-indigo-200/50';
    if (scheduledFor === 'Yesterday') return 'bg-zinc-400/10 text-zinc-500 border-zinc-200/50';
    return 'bg-teal-500/10 text-teal-500 border-teal-200/50';
  };
  
  const handleAddTask = (content: string) => {
    if (onAddTask) {
      onAddTask(content);
    }
    setIsAddTaskOpen(false);
  };
  
  return (
    <>
      <GlassModuleCard
        icon={<CheckSquare className="w-4 h-4" />}
        title="Tasks"
        count={tasks.length}
        onAdd={() => setIsAddTaskOpen(true)}
        addLabel="Add Task"
        accentColor="#10b981"
      >
        {tasks.length === 0 ? (
          <ProjectEmptyState
            icon={<CheckSquare className="w-7 h-7" />}
            title="No tasks yet"
            description="Break down your project into actionable steps."
            actionLabel="Add Task"
            onAction={() => setIsAddTaskOpen(true)}
          />
        ) : (
          <ul className="space-y-1.5">
            {tasks.map(task => (
              <li 
                key={task.id}
                className={cn(
                  "flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200",
                  "bg-white/30 dark:bg-white/[0.03]",
                  "border border-white/20 dark:border-white/[0.06]",
                  "hover:bg-white/50 dark:hover:bg-white/[0.06]",
                  "hover:translate-y-[-1px] hover:shadow-sm"
                )}
              >
                <span 
                  className={cn(
                    "flex-1 text-sm",
                    task.completed && "line-through text-muted-foreground"
                  )}
                >
                  {task.content}
                </span>
                {task.scheduledFor && (
                  <Badge 
                    variant="outline" 
                    className={cn("text-[10px] h-5 font-medium", getBadgeColorForSchedule(task.scheduledFor))}
                  >
                    {task.scheduledFor}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </GlassModuleCard>
      
      <AddTaskDialog
        open={isAddTaskOpen}
        onOpenChange={setIsAddTaskOpen}
        onAddTask={(taskData) => handleAddTask(taskData.content)}
      />
    </>
  );
}
