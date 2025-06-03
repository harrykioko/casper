
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/useCategories";
import { filterTodayTasks } from "@/utils/dateFiltering";
import { Task } from "@/hooks/useTasks";
import { TaskCardContent } from "@/components/task-cards/TaskCardContent";
import { TaskCardMetadata } from "@/components/task-cards/TaskCardMetadata";
import { cn } from "@/lib/utils";

interface TodayTasksSectionProps {
  tasks: Task[];
  onTaskComplete: (id: string) => void;
  onTaskDelete: (id: string) => void;
  onTaskClick: (task: Task) => void;
}

export function TodayTasksSection({ tasks, onTaskComplete, onTaskDelete, onTaskClick }: TodayTasksSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { categories } = useCategories();

  const todayTasks = filterTodayTasks(tasks, selectedCategory);

  return (
    <div className="space-y-6">
      {/* Section Title */}
      <h2 className="text-2xl font-semibold text-foreground">Today</h2>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedCategory('all')}
          className={cn(
            "rounded-full px-4 py-1 text-sm font-medium transition-all",
            selectedCategory === 'all'
              ? "bg-gradient-to-r from-[#FF6A79] to-[#415AFF] text-white hover:from-[#FF6A79] hover:to-[#415AFF]"
              : "bg-muted/30 text-muted-foreground border border-muted/40 hover:bg-muted/40"
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
              "rounded-full px-4 py-1 text-sm font-medium transition-all",
              selectedCategory === category.name
                ? "bg-gradient-to-r from-[#FF6A79] to-[#415AFF] text-white hover:from-[#FF6A79] hover:to-[#415AFF]"
                : "bg-muted/30 text-muted-foreground border border-muted/40 hover:bg-muted/40"
            )}
          >
            {category.name}
          </Button>
        ))}
      </div>

      {/* Today's Task List */}
      <div className="space-y-3">
        {todayTasks.length > 0 ? (
          todayTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => onTaskClick(task)}
              className={cn(
                "group p-4 rounded-xl bg-muted/20 backdrop-blur border border-muted/30 cursor-pointer transition-all hover:shadow-md hover:bg-muted/30",
                task.completed && "opacity-60"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <TaskCardContent 
                    content={task.content} 
                    completed={task.completed}
                    className="text-base"
                  />
                  
                  <TaskCardMetadata
                    priority={task.priority}
                    project={task.project}
                    scheduledFor={task.scheduledFor}
                    layout="list"
                  />
                </div>
                
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskComplete(task.id);
                    }}
                    className="h-8 w-8 rounded-full"
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2",
                      task.completed 
                        ? 'bg-primary border-primary' 
                        : 'border-muted-foreground hover:border-primary'
                    )} />
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
              <span className="text-2xl">📭</span>
            </div>
            <p className="text-muted-foreground">
              {selectedCategory === 'all' 
                ? "Nothing due today." 
                : `Nothing due today in ${selectedCategory}.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
