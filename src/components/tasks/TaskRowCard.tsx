import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { EnrichedTask } from "@/hooks/useEnrichedTasks";
import { EntityPill } from "./EntityPill";
import { InlineTaskActions } from "./InlineTaskActions";
import { format, parseISO, isToday, isTomorrow, isPast, differenceInDays } from "date-fns";

interface TaskRowCardProps {
  task: EnrichedTask;
  variant?: 'prominent' | 'default' | 'muted';
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onSnooze: (id: string, until: Date) => void;
  onReschedule: (id: string, date: Date) => void;
  onUpdatePriority: (id: string, priority: string) => void;
  onUpdateEffort: (id: string, minutes: number, category: string) => void;
  onArchive?: (id: string) => void;
  onClick: (task: EnrichedTask) => void;
}

// Subtle priority colors - no aggressive red
const priorityConfig = {
  high: { 
    label: "P1", 
    className: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" 
  },
  medium: { 
    label: "P2", 
    className: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" 
  },
  low: { 
    label: "P3", 
    className: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" 
  },
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

function getDateBadgeStyles(dateString?: string): string {
  if (!dateString) return "";
  if (isOverdue(dateString)) return "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400";
  if (isToday(parseISO(dateString))) return "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400";
  if (isTomorrow(parseISO(dateString))) return "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400";
  return "bg-muted text-muted-foreground";
}

export function TaskRowCard({
  task,
  variant = 'default',
  onComplete,
  onDelete,
  onSnooze,
  onReschedule,
  onUpdatePriority,
  onUpdateEffort,
  onArchive,
  onClick,
}: TaskRowCardProps) {
  const [isExiting, setIsExiting] = useState(false);

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExiting(true);
    setTimeout(() => onComplete(task.id), 250);
  };

  const isOverdueTask = isOverdue(task.scheduledFor);
  const isDueToday = task.scheduledFor && isToday(parseISO(task.scheduledFor));

  // Variant-based styling
  const variantStyles = {
    prominent: cn(
      "py-3 px-4",
      isOverdueTask && "bg-rose-50/50 dark:bg-rose-950/10",
      isDueToday && !isOverdueTask && "bg-amber-50/30 dark:bg-amber-950/10"
    ),
    default: "py-2.5 px-4",
    muted: "py-2 px-3 opacity-75",
  };

  const checkboxStyles = {
    prominent: "h-5 w-5 border-2",
    default: "h-4 w-4 border",
    muted: "h-4 w-4 border opacity-80",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: isExiting ? 0 : 1, x: 0, height: isExiting ? 0 : "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.15 }}
      onClick={() => onClick(task)}
      className={cn(
        "group relative rounded-lg transition-all duration-150 cursor-pointer",
        "bg-card hover:bg-accent/50",
        "border border-border/50 hover:border-border",
        variantStyles[variant],
        task.completed && "opacity-50"
      )}
    >
      {/* Single-row layout */}
      <div className="flex items-center gap-3">
        {/* Checkbox */}
        <Button
          size="icon"
          variant="outline"
          className={cn(
            "rounded-full flex-shrink-0 transition-colors",
            checkboxStyles[variant],
            task.completed && "bg-primary border-primary"
          )}
          onClick={handleComplete}
        >
          {task.completed && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
        </Button>

        {/* Title - takes available space */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-medium leading-tight truncate",
            task.completed && "line-through text-muted-foreground",
            variant === 'muted' && "text-muted-foreground"
          )}>
            {task.content}
          </p>
          
          {/* Entity on second line only when it exists */}
          {task.linkedEntity && (
            <div className="mt-1">
              <EntityPill entity={task.linkedEntity} size="sm" />
            </div>
          )}
        </div>

        {/* Right-aligned metadata */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Due Date Badge */}
          {task.scheduledFor && (
            <span className={cn(
              "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full",
              getDateBadgeStyles(task.scheduledFor)
            )}>
              <Calendar className="h-2.5 w-2.5" />
              {formatRelativeDate(task.scheduledFor)}
            </span>
          )}

          {/* Priority Badge - subtle pill */}
          {task.priority && priorityConfig[task.priority as keyof typeof priorityConfig] && (
            <span className={cn(
              "text-[10px] font-medium px-2 py-0.5 rounded-full",
              priorityConfig[task.priority as keyof typeof priorityConfig].className
            )}>
              {priorityConfig[task.priority as keyof typeof priorityConfig].label}
            </span>
          )}
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
          variant="compact"
          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        />
      </div>
    </motion.div>
  );
}
