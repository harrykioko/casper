
import { useState } from "react";
import { Check, Trash } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Task } from "@/hooks/useTasks";
import { TaskCardContent } from "@/components/task-cards/TaskCardContent";
import { TaskCardMetadata } from "@/components/task-cards/TaskCardMetadata";

interface TaskListProps {
  tasks: Task[];
  onTaskComplete: (id: string) => void;
  onTaskDelete: (id: string) => void;
  onTaskClick: (task: Task) => void;
}

export function TaskList({ tasks, onTaskComplete, onTaskDelete, onTaskClick }: TaskListProps) {
  const [showConfetti, setShowConfetti] = useState<string | null>(null);
  
  const handleComplete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setShowConfetti(id);
    onTaskComplete(id);
    
    setTimeout(() => {
      setShowConfetti(null);
    }, 1000);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onTaskDelete(id);
  };

  const getPriorityColor = (priority?: "low" | "medium" | "high") => {
    switch (priority) {
      case "high": return "border-red-500";
      case "medium": return "border-orange-500";
      case "low": return "border-gray-400";
      default: return "border-muted/30";
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No tasks yet. Try adding some!</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {tasks.map((task) => (
        <li 
          key={task.id}
          className={cn(
            "group flex items-start rounded-xl p-3 shadow-sm bg-muted/30 backdrop-blur border border-muted/30 hover:bg-muted/40 hover:ring-1 hover:ring-muted/50 transition-all duration-200 cursor-pointer",
            task.completed && "opacity-60"
          )}
          onClick={() => onTaskClick(task)}
        >
          <div className="relative">
            <Button
              size="icon"
              variant="outline"
              className={cn(
                "rounded-full h-6 w-6 mr-3 mt-0.5 check-pulse border-2",
                getPriorityColor(task.priority)
              )}
              onClick={(e) => handleComplete(e, task.id)}
            >
              {task.completed && <Check className="h-3 w-3" />}
              {showConfetti === task.id && (
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(10)].map((_, i) => (
                    <span
                      key={i}
                      className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-gradient-primary animate-confetti"
                      style={{
                        animationDelay: `${i * 0.05}s`,
                        transform: `rotate(${i * 36}deg)`,
                      }}
                    />
                  ))}
                </div>
              )}
            </Button>
          </div>
          
          <div className="flex-1 flex flex-col gap-1">
            <TaskCardContent 
              content={task.content} 
              completed={task.completed}
            />
            <TaskCardMetadata
              priority={task.priority}
              project={task.project}
              scheduledFor={task.scheduledFor}
              layout="list"
            />
          </div>
          
          <Button
            size="icon"
            variant="ghost"
            className="opacity-0 group-hover:opacity-100 h-7 w-7 rounded-full"
            onClick={(e) => handleDelete(e, task.id)}
          >
            <Trash className="h-3.5 w-3.5" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
