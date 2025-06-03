
import { useState } from "react";
import { Check, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Task } from "@/hooks/useTasks";
import { TaskCardContent } from "@/components/task-cards/TaskCardContent";
import { TaskCardMetadata } from "@/components/task-cards/TaskCardMetadata";

interface QuickTasksPanelProps {
  quickTasks: Task[];
  onTaskComplete: (id: string) => void;
  onTaskDelete: (id: string) => void;
  onTaskClick: (task: Task) => void;
}

export function QuickTasksPanel({ quickTasks, onTaskComplete, onTaskDelete, onTaskClick }: QuickTasksPanelProps) {
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

  return (
    <div className="lg:w-[30%] lg:min-w-[320px]">
      <Card className="glassmorphic border-muted/30 sticky top-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            ⚡ Quick Tasks
          </CardTitle>
          <p className="text-sm text-muted-foreground">Quick capture for triage</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {quickTasks.length > 0 ? (
            quickTasks.map((task) => (
              <div
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
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-2xl mb-2">⚡</div>
              <p className="text-sm">No quick tasks yet</p>
              <p className="text-xs mt-1">Tasks added above will appear here for triage</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
