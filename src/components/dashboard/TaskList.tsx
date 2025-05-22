
import { useState } from "react";
import { Check, Clock, Trash } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface Task {
  id: string;
  content: string;
  completed: boolean;
  project?: {
    id: string;
    name: string;
    color: string;
  };
  priority?: "low" | "medium" | "high";
  scheduledFor?: string;
  status?: "todo" | "inprogress" | "done";
}

interface TaskListProps {
  tasks: Task[];
  onTaskComplete: (id: string) => void;
  onTaskDelete: (id: string) => void;
  onTaskClick: (task: Task) => void;
}

export function TaskList({ tasks, onTaskComplete, onTaskDelete, onTaskClick }: TaskListProps) {
  const [showConfetti, setShowConfetti] = useState<string | null>(null);
  
  const handleComplete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Stop event bubbling to prevent opening the task dialog
    setShowConfetti(id);
    onTaskComplete(id);
    
    // Reset confetti after animation completes
    setTimeout(() => {
      setShowConfetti(null);
    }, 1000);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Stop event bubbling
    onTaskDelete(id);
  };

  const getPriorityColor = (priority?: "low" | "medium" | "high") => {
    switch (priority) {
      case "high": return "border-red-500";
      case "medium": return "border-yellow-500";
      case "low": return "border-green-500";
      default: return "border-transparent";
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
            "group flex items-start p-3 rounded-lg hover:glassmorphic transition-all duration-200 cursor-pointer",
            task.completed && "opacity-50"
          )}
          onClick={() => onTaskClick(task)}
        >
          <div className="relative">
            <Button
              size="icon"
              variant="outline"
              className={cn(
                "rounded-full h-6 w-6 mr-3 mt-0.5 check-pulse",
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
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className={cn(
                task.completed && "line-through text-muted-foreground"
              )}>
                {task.content}
              </p>
              {task.project && (
                <Badge 
                  variant="outline"
                  className="text-xs bg-white/10 text-sm px-2 rounded-full backdrop-blur-sm transition-transform hover:shadow hover:scale-[1.02]"
                  style={{
                    borderColor: task.project.color,
                    color: task.project.color,
                  }}
                >
                  {task.project.name}
                </Badge>
              )}
            </div>
            {task.scheduledFor && (
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <Clock className="h-3 w-3 mr-1" />
                {task.scheduledFor}
              </div>
            )}
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
