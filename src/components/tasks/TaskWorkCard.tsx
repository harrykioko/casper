import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Trash2, Calendar, Building2, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Task } from "@/hooks/useTasks";
import { format, parseISO, isToday, isTomorrow, isPast, differenceInDays } from "date-fns";
import { TaskCardEffort } from "@/components/task-cards/TaskCardEffort";

interface TaskWorkCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (task: Task) => void;
  onQuickUpdate?: (id: string, updates: Partial<Task>) => void;
}

const priorityConfig = {
  high: { label: "P1", className: "bg-destructive/10 text-destructive border-destructive/20" },
  medium: { label: "P2", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  low: { label: "P3", className: "bg-muted text-muted-foreground border-muted" },
};

function formatRelativeDate(dateString?: string): string {
  if (!dateString) return "";
  const date = parseISO(dateString);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  const days = differenceInDays(date, new Date());
  if (days < 0) return format(date, "MMM d");
  if (days < 7) return format(date, "EEE");
  return format(date, "MMM d");
}

function isOverdue(dateString?: string): boolean {
  if (!dateString) return false;
  const date = parseISO(dateString);
  return isPast(date) && !isToday(date);
}

export function TaskWorkCard({ 
  task, 
  onComplete, 
  onDelete, 
  onClick,
  onQuickUpdate 
}: TaskWorkCardProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const isHighPriority = task.priority === "high" || isOverdue(task.scheduledFor);
  const isMediumPriority = task.priority === "medium";
  const isLowPriority = task.priority === "low" || (!task.priority && !task.scheduledFor);

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfetti(true);
    setIsExiting(true);
    
    setTimeout(() => {
      onComplete(task.id);
    }, 300);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExiting(true);
    setTimeout(() => {
      onDelete(task.id);
    }, 200);
  };

  // Get primary linked entity (company > project > source)
  const linkedEntity = task.project ? {
    type: "project" as const,
    name: task.project.name,
    color: task.project.color,
  } : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isExiting ? 0 : 1, y: 0, height: isExiting ? 0 : "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group relative rounded-2xl transition-all duration-200 cursor-pointer",
        "bg-white/60 dark:bg-white/[0.04]",
        "border border-white/20 dark:border-white/[0.08]",
        "backdrop-blur-sm",
        "hover:bg-white/80 dark:hover:bg-white/[0.08]",
        "hover:shadow-sm hover:-translate-y-0.5",
        // Priority-based hierarchy
        isHighPriority && "py-4 px-4 border-l-2 border-l-destructive",
        isMediumPriority && "py-3 px-4",
        isLowPriority && "py-2.5 px-4 opacity-80",
        task.completed && "opacity-50"
      )}
      onClick={() => onClick(task)}
    >
      {/* Confetti effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          {[...Array(12)].map((_, i) => (
            <span
              key={i}
              className="absolute left-4 top-1/2 h-1.5 w-1.5 rounded-full bg-primary animate-confetti"
              style={{
                animationDelay: `${i * 0.04}s`,
                transform: `rotate(${i * 30}deg)`,
              }}
            />
          ))}
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Completion Checkbox */}
        <Button
          size="icon"
          variant="outline"
          className={cn(
            "rounded-full flex-shrink-0 transition-all",
            isHighPriority ? "h-7 w-7 border-2 border-destructive" : "h-6 w-6 border-2",
            isMediumPriority && "border-amber-500",
            isLowPriority && "border-muted-foreground/40",
            task.completed && "bg-primary border-primary"
          )}
          onClick={handleComplete}
        >
          {task.completed && <Check className="h-3 w-3 text-primary-foreground" />}
        </Button>

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Task Title */}
          <p className={cn(
            "font-medium leading-snug",
            isHighPriority ? "text-base" : "text-sm",
            task.completed && "line-through text-muted-foreground"
          )}>
            {task.content}
          </p>

          {/* Context Strip - One linked entity */}
          {linkedEntity && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {linkedEntity.type === "project" && (
                <>
                  <div 
                    className="w-2.5 h-2.5 rounded-sm" 
                    style={{ backgroundColor: linkedEntity.color || 'hsl(var(--muted))' }}
                  />
                  <span className="truncate">{linkedEntity.name}</span>
                </>
              )}
            </div>
          )}

          {/* Metadata Row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Due Date */}
            {task.scheduledFor && (
              <span className={cn(
                "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
                isOverdue(task.scheduledFor) 
                  ? "bg-destructive/10 text-destructive"
                  : isToday(parseISO(task.scheduledFor))
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "bg-muted text-muted-foreground"
              )}>
                <Calendar className="h-3 w-3" />
                {formatRelativeDate(task.scheduledFor)}
              </span>
            )}

            {/* Priority Badge */}
            {task.priority && priorityConfig[task.priority] && (
              <span className={cn(
                "text-[10px] font-semibold px-1.5 py-0.5 rounded border",
                priorityConfig[task.priority].className
              )}>
                {priorityConfig[task.priority].label}
              </span>
            )}

            {/* Effort Chip */}
            <TaskCardEffort 
              effortMinutes={task.effort_minutes} 
              effortCategory={task.effort_category}
            />
          </div>
        </div>

        {/* Delete Button (hover reveal) */}
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}
