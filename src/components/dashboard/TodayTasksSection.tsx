import { useState, useMemo } from "react";
import { format, parseISO, addDays, startOfWeek, addWeeks } from "date-fns";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/useCategories";
import { filterTodayTasks } from "@/utils/dateFiltering";
import { Task } from "@/hooks/useTasks";
import { TaskCardContent } from "@/components/task-cards/TaskCardContent";
import { ActionPanelRow } from "@/components/ui/action-panel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Check, Calendar, Flag, Pin, CheckCircle2 } from "lucide-react";

interface TodayTasksSectionProps {
  tasks: Task[];
  onTaskComplete: (id: string) => void;
  onTaskDelete: (id: string) => void;
  onTaskClick: (task: Task) => void;
  onUpdateTask?: (task: Task) => void;
  compact?: boolean;
}

const priorityLevels = ["low", "medium", "high"] as const;
type PriorityLevel = (typeof priorityLevels)[number];

const priorityStyles: Record<PriorityLevel, string> = {
  low: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function TodayTasksSection({
  tasks,
  onTaskComplete,
  onTaskDelete,
  onTaskClick,
  onUpdateTask,
  compact = false,
}: TodayTasksSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [pinnedTasks, setPinnedTasks] = useState<string[]>([]);
  const { categories } = useCategories();

  const todayTasks = filterTodayTasks(tasks, selectedCategory);

  // Sort tasks with pinned at top
  const sortedTasks = useMemo(() => {
    return [...todayTasks].sort((a, b) => {
      const aPin = pinnedTasks.includes(a.id) ? 0 : 1;
      const bPin = pinnedTasks.includes(b.id) ? 0 : 1;
      return aPin - bPin;
    });
  }, [todayTasks, pinnedTasks]);

  // In compact mode, show fewer tasks
  const displayTasks = compact ? sortedTasks.slice(0, 5) : sortedTasks;

  const handleTogglePin = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    // TODO: Wire to backend if pin field is added later
    setPinnedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleSetDueDate = (e: React.MouseEvent, task: Task, option: "today" | "tomorrow" | "next_week") => {
    e.stopPropagation();
    if (!onUpdateTask) return;

    let newDate: Date;
    const now = new Date();
    switch (option) {
      case "today":
        newDate = now;
        break;
      case "tomorrow":
        newDate = addDays(now, 1);
        break;
      case "next_week":
        newDate = startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
        break;
    }

    onUpdateTask({
      ...task,
      scheduledFor: format(newDate, "yyyy-MM-dd"),
    });
  };

  const handleCyclePriority = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    if (!onUpdateTask) return;

    const currentPriority = (task.priority as PriorityLevel) || "low";
    const currentIndex = priorityLevels.indexOf(currentPriority);
    const nextIndex = (currentIndex + 1) % priorityLevels.length;
    const nextPriority = priorityLevels[nextIndex];

    onUpdateTask({
      ...task,
      priority: nextPriority,
    });
  };

  return (
    <div className="space-y-2">
      {/* Category Filter Pills - only show in non-compact mode */}
      {!compact && (
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "rounded-full px-4 py-1 text-sm font-medium transition-all h-8",
              selectedCategory === "all"
                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
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
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              {category.name}
            </Button>
          ))}
        </div>
      )}

      {/* Task List */}
      <div>
        {displayTasks.length > 0 ? (
          displayTasks.map((task, index) => {
            const isPinned = pinnedTasks.includes(task.id);
            const priority = (task.priority as PriorityLevel) || "low";
            const isLast = index === displayTasks.length - 1;

            return (
              <ActionPanelRow
                key={task.id}
                onClick={() => onTaskClick(task)}
                isLast={isLast}
                className={cn(task.completed && "opacity-60")}
              >
                {/* Left content */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Completion checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskComplete(task.id);
                    }}
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
                      task.completed
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-slate-300 dark:border-slate-600 hover:border-emerald-500 group-hover:border-emerald-400"
                    )}
                  >
                    {task.completed && <Check className="w-3 h-3 text-white" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <TaskCardContent
                      content={task.content}
                      completed={task.completed}
                      className={cn("text-sm text-slate-700 dark:text-slate-200", task.completed && "line-through text-slate-400")}
                    />

                    {/* Inline action chips (appear on hover) */}
                    <div
                      className={cn(
                        "flex items-center gap-2 mt-2 transition-opacity",
                        compact ? "opacity-0 group-hover:opacity-100" : "opacity-70 group-hover:opacity-100"
                      )}
                    >
                      {/* Due Date Chip */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1 transition-colors"
                          >
                            <Calendar className="h-3 w-3" />
                            {task.scheduledFor
                              ? format(parseISO(task.scheduledFor), "MMM d")
                              : "Set date"}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="bg-popover">
                          <DropdownMenuItem onClick={(e) => handleSetDueDate(e as any, task, "today")}>
                            Today
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleSetDueDate(e as any, task, "tomorrow")}>
                            Tomorrow
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleSetDueDate(e as any, task, "next_week")}>
                            Next week
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Priority Cycle Chip */}
                      <button
                        onClick={(e) => handleCyclePriority(e, task)}
                        className={cn(
                          "text-[10px] px-2 py-1 rounded-full flex items-center gap-1 transition-colors capitalize",
                          priorityStyles[priority]
                        )}
                      >
                        <Flag className="h-3 w-3" />
                        {priority}
                      </button>

                      {/* Pin/Focus Button */}
                      <button
                        onClick={(e) => handleTogglePin(e, task.id)}
                        className={cn(
                          "text-[10px] px-2 py-1 rounded-full flex items-center gap-1 transition-colors",
                          isPinned
                            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                        )}
                      >
                        <Pin className={cn("h-3 w-3", isPinned && "fill-current")} />
                        {isPinned ? "Pinned" : "Pin"}
                      </button>
                    </div>
                  </div>
                </div>
              </ActionPanelRow>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {selectedCategory === "all" ? "Nothing due today." : `Nothing in ${selectedCategory}.`}
            </p>
          </div>
        )}
      </div>

      {/* Show more indicator in compact mode */}
      {compact && sortedTasks.length > 5 && (
        <p className="text-[10px] text-slate-400 text-center pt-2">
          +{sortedTasks.length - 5} more tasks
        </p>
      )}
    </div>
  );
}
