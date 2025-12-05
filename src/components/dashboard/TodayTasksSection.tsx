import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/useCategories";
import { filterTodayTasks } from "@/utils/dateFiltering";
import { Task } from "@/hooks/useTasks";
import { TaskCardContent } from "@/components/task-cards/TaskCardContent";
import { TaskCardMetadata } from "@/components/task-cards/TaskCardMetadata";
import { GlassSubcard } from "@/components/ui/glass-panel";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface TodayTasksSectionProps {
  tasks: Task[];
  onTaskComplete: (id: string) => void;
  onTaskDelete: (id: string) => void;
  onTaskClick: (task: Task) => void;
  compact?: boolean;
}

export function TodayTasksSection({ 
  tasks, 
  onTaskComplete, 
  onTaskDelete, 
  onTaskClick,
  compact = false 
}: TodayTasksSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { categories } = useCategories();

  const todayTasks = filterTodayTasks(tasks, selectedCategory);

  // In compact mode, show fewer tasks
  const displayTasks = compact ? todayTasks.slice(0, 5) : todayTasks;

  return (
    <div className="space-y-4">
      {/* Category Filter Pills - only show in non-compact mode */}
      {!compact && (
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCategory('all')}
            className={cn(
              "rounded-full px-4 py-1 text-sm font-medium transition-all h-8",
              selectedCategory === 'all'
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-white/50 dark:bg-white/5 text-muted-foreground border border-white/30 dark:border-white/10 hover:bg-white/70 dark:hover:bg-white/10"
            )}
          >
            All
          </Button>
          
          {categories.map((category) => (
            <Button
              key={category.id}
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategory(category.name)}
              className={cn(
                "rounded-full px-4 py-1 text-sm font-medium transition-all h-8",
                selectedCategory === category.name
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-white/50 dark:bg-white/5 text-muted-foreground border border-white/30 dark:border-white/10 hover:bg-white/70 dark:hover:bg-white/10"
              )}
            >
              {category.name}
            </Button>
          ))}
        </div>
      )}

      {/* Task List */}
      <div className="space-y-2">
        {displayTasks.length > 0 ? (
          displayTasks.map((task) => (
            <GlassSubcard
              key={task.id}
              onClick={() => onTaskClick(task)}
              className={cn(
                "group",
                task.completed && "opacity-60"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Completion checkbox */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTaskComplete(task.id);
                  }}
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
                    task.completed 
                      ? 'bg-primary border-primary' 
                      : 'border-muted-foreground/40 hover:border-primary group-hover:border-primary/60'
                  )}
                >
                  {task.completed && <Check className="w-3 h-3 text-primary-foreground" />}
                </button>
                
                <div className="flex-1 min-w-0">
                  <TaskCardContent 
                    content={task.content} 
                    completed={task.completed}
                    className={cn("text-sm", compact && "text-sm")}
                  />
                  
                  {!compact && (
                    <TaskCardMetadata
                      priority={task.priority}
                      project={task.project}
                      scheduledFor={task.scheduledFor}
                      layout="list"
                    />
                  )}
                </div>
              </div>
            </GlassSubcard>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
              <span className="text-xl">📭</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedCategory === 'all' 
                ? "Nothing due today." 
                : `Nothing in ${selectedCategory}.`
              }
            </p>
          </div>
        )}
      </div>

      {/* Show more indicator in compact mode */}
      {compact && todayTasks.length > 5 && (
        <p className="text-xs text-muted-foreground/70 text-center">
          +{todayTasks.length - 5} more tasks
        </p>
      )}
    </div>
  );
}
