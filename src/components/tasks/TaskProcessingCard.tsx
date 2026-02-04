import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { EnrichedTask } from "@/hooks/useEnrichedTasks";
import { EntityPill } from "./EntityPill";
import { InlineTaskActions } from "./InlineTaskActions";
import { TaskCardEffort } from "@/components/task-cards/TaskCardEffort";
import { format, parseISO, isToday, isTomorrow, isPast, differenceInDays } from "date-fns";

interface TaskProcessingCardProps {
  task: EnrichedTask;
  visualWeight: 'high' | 'medium' | 'low' | 'muted';
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onSnooze: (id: string, until: Date) => void;
  onReschedule: (id: string, date: Date) => void;
  onUpdatePriority: (id: string, priority: string) => void;
  onUpdateEffort: (id: string, minutes: number, category: string) => void;
  onArchive?: (id: string) => void;
  onClick: (task: EnrichedTask) => void;
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
  if (days < 7) return format(date, "EEEE");
  return format(date, "MMM d");
}

function isOverdue(dateString?: string): boolean {
  if (!dateString) return false;
  const date = parseISO(dateString);
  return isPast(date) && !isToday(date);
}

function getDateStyles(dateString?: string): string {
  if (!dateString) return "bg-muted/50 text-muted-foreground";
  if (isOverdue(dateString)) return "bg-destructive/10 text-destructive";
  if (isToday(parseISO(dateString))) return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  if (isTomorrow(parseISO(dateString))) return "bg-sky-500/10 text-sky-600 dark:text-sky-400";
  return "bg-muted/50 text-muted-foreground";
}

export function TaskProcessingCard({
  task,
  visualWeight,
  onComplete,
  onDelete,
  onSnooze,
  onReschedule,
  onUpdatePriority,
  onUpdateEffort,
  onArchive,
  onClick,
}: TaskProcessingCardProps) {
  const [isExiting, setIsExiting] = useState(false);

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExiting(true);
    setTimeout(() => onComplete(task.id), 300);
  };

  const isOverdueTask = isOverdue(task.scheduledFor);
  const isDueToday = task.scheduledFor && isToday(parseISO(task.scheduledFor));

  // Visual hierarchy based on weight
  const weightStyles = {
    high: "py-4 px-4",
    medium: "py-3 px-4",
    low: "py-2.5 px-3.5 opacity-85",
    muted: "py-2 px-3 opacity-70",
  };

  const checkboxSize = {
    high: "h-7 w-7 border-2",
    medium: "h-6 w-6 border-2",
    low: "h-5 w-5 border",
    muted: "h-5 w-5 border",
  };

  const titleSize = {
    high: "text-base",
    medium: "text-sm",
    low: "text-sm",
    muted: "text-sm",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isExiting ? 0 : 1, y: 0, height: isExiting ? 0 : "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => onClick(task)}
      className={cn(
        "group relative rounded-xl transition-all duration-200 cursor-pointer",
        "bg-white/60 dark:bg-white/[0.04]",
        "border border-white/20 dark:border-white/[0.08]",
        "backdrop-blur-sm",
        "hover:bg-white/80 dark:hover:bg-white/[0.08]",
        "hover:shadow-sm hover:-translate-y-0.5",
        weightStyles[visualWeight],
        (isOverdueTask || (visualWeight === 'high' && task.priority === 'high')) && 
          "border-l-2 border-l-destructive",
        isDueToday && !isOverdueTask && "border-l-2 border-l-amber-500",
        task.completed && "opacity-50"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Completion Checkbox */}
        <Button
          size="icon"
          variant="outline"
          className={cn(
            "rounded-full flex-shrink-0 transition-all",
            checkboxSize[visualWeight],
            isOverdueTask && "border-destructive",
            isDueToday && !isOverdueTask && "border-amber-500",
            task.priority === 'high' && !isOverdueTask && !isDueToday && "border-destructive/60",
            task.priority === 'medium' && !isOverdueTask && !isDueToday && "border-amber-500/60",
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
            titleSize[visualWeight],
            task.completed && "line-through text-muted-foreground"
          )}>
            {task.content}
          </p>

          {/* Context Strip - One linked entity */}
          {task.linkedEntity && (
            <EntityPill entity={task.linkedEntity} size="sm" />
          )}

          {/* Metadata Row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Due Date */}
            {task.scheduledFor && (
              <span className={cn(
                "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium",
                getDateStyles(task.scheduledFor)
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

        {/* Inline Actions - reveal on hover */}
        <InlineTaskActions
          taskId={task.id}
          onSnooze={(until) => onSnooze(task.id, until)}
          onReschedule={(date) => onReschedule(task.id, date)}
          onUpdatePriority={(p) => onUpdatePriority(task.id, p)}
          onUpdateEffort={(m, c) => onUpdateEffort(task.id, m, c)}
          onArchive={onArchive ? () => onArchive(task.id) : undefined}
          onDelete={() => onDelete(task.id)}
          variant="full"
          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        />
      </div>
    </motion.div>
  );
}
