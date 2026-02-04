import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { EnrichedTask } from "@/hooks/useEnrichedTasks";
import { EntityPill } from "./EntityPill";
import { InlineTaskActions } from "./InlineTaskActions";
import { TaskCardEffort } from "@/components/task-cards/TaskCardEffort";
import { format, parseISO, isToday, isPast } from "date-fns";

interface TodayTaskCardProps {
  task: EnrichedTask;
  onComplete: (id: string) => void;
  onSnooze: (id: string, until: Date) => void;
  onReschedule: (id: string, date: Date) => void;
  onUpdatePriority: (id: string, priority: string) => void;
  onUpdateEffort: (id: string, minutes: number, category: string) => void;
  onClick: (task: EnrichedTask) => void;
}

const priorityConfig = {
  high: { label: "P1", className: "bg-destructive/10 text-destructive border-destructive/20" },
  medium: { label: "P2", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  low: { label: "P3", className: "bg-muted text-muted-foreground border-muted" },
};

function isOverdue(dateString?: string): boolean {
  if (!dateString) return false;
  const date = parseISO(dateString);
  return isPast(date) && !isToday(date);
}

function getDueBadge(dateString?: string): { label: string; className: string } | null {
  if (!dateString) return null;
  const date = parseISO(dateString);
  
  if (isOverdue(dateString)) {
    return { label: "Overdue", className: "bg-destructive/10 text-destructive" };
  }
  if (isToday(date)) {
    return { label: "Today", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" };
  }
  return null;
}

export function TodayTaskCard({
  task,
  onComplete,
  onSnooze,
  onReschedule,
  onUpdatePriority,
  onUpdateEffort,
  onClick,
}: TodayTaskCardProps) {
  const [isExiting, setIsExiting] = useState(false);

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExiting(true);
    setTimeout(() => onComplete(task.id), 250);
  };

  const dueBadge = getDueBadge(task.scheduledFor);
  const isOverdueTask = isOverdue(task.scheduledFor);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: isExiting ? 0 : 1, scale: isExiting ? 0.9 : 1 }}
      exit={{ opacity: 0, scale: 0.9, width: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => onClick(task)}
      className={cn(
        "group flex-shrink-0 flex items-center gap-3 px-3 py-2.5 cursor-pointer",
        "rounded-xl transition-all duration-200",
        "bg-white/70 dark:bg-white/[0.06]",
        "border border-white/30 dark:border-white/[0.1]",
        "backdrop-blur-sm",
        "hover:bg-white/90 dark:hover:bg-white/[0.1]",
        "hover:shadow-md hover:-translate-y-0.5",
        "min-w-[280px] max-w-[340px]",
        isOverdueTask && "border-l-2 border-l-destructive"
      )}
    >
      {/* Checkbox */}
      <Button
        size="icon"
        variant="outline"
        className={cn(
          "h-6 w-6 rounded-full flex-shrink-0 border-2",
          isOverdueTask ? "border-destructive" : "border-amber-500"
        )}
        onClick={handleComplete}
      >
        {task.completed && <Check className="h-3 w-3 text-primary-foreground" />}
      </Button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight truncate">
          {task.content}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          {task.linkedEntity && (
            <EntityPill entity={task.linkedEntity} size="sm" />
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Due Badge */}
        {dueBadge && (
          <span className={cn(
            "text-[10px] font-semibold px-1.5 py-0.5 rounded",
            dueBadge.className
          )}>
            {dueBadge.label}
          </span>
        )}

        {/* Priority */}
        {task.priority && priorityConfig[task.priority] && (
          <span className={cn(
            "text-[10px] font-semibold px-1.5 py-0.5 rounded border",
            priorityConfig[task.priority].className
          )}>
            {priorityConfig[task.priority].label}
          </span>
        )}

        {/* Effort */}
        <TaskCardEffort
          effortMinutes={task.effort_minutes}
          effortCategory={task.effort_category}
        />
      </div>

      {/* Actions - always visible on Today cards */}
      <InlineTaskActions
        taskId={task.id}
        onSnooze={(until) => onSnooze(task.id, until)}
        onReschedule={(date) => onReschedule(task.id, date)}
        onUpdatePriority={(p) => onUpdatePriority(task.id, p)}
        onUpdateEffort={(m, c) => onUpdateEffort(task.id, m, c)}
        variant="compact"
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </motion.div>
  );
}
