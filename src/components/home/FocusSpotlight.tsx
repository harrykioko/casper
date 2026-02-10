import { motion } from "framer-motion";
import { Check, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EnrichedTask } from "@/hooks/useEnrichedTasks";
import { differenceInDays, isToday, isPast, parseISO, startOfDay } from "date-fns";

interface FocusSpotlightProps {
  task: EnrichedTask;
  onComplete: (id: string) => void;
  onSnooze: (id: string) => void;
}

function getUrgencyInfo(task: EnrichedTask) {
  if (!task.scheduledFor) return null;
  const scheduled = parseISO(task.scheduledFor);
  const today = startOfDay(new Date());

  if (isPast(scheduled) && !isToday(scheduled)) {
    const days = differenceInDays(today, startOfDay(scheduled));
    return {
      label: "Overdue",
      sublabel: `${days} day${days !== 1 ? "s" : ""} overdue`,
      variant: "destructive" as const,
    };
  }
  if (isToday(scheduled)) {
    return { label: "Due Today", sublabel: null, variant: "warning" as const };
  }
  if (task.priority === "high") {
    return { label: "High Priority", sublabel: null, variant: "default" as const };
  }
  return null;
}

export function FocusSpotlight({ task, onComplete, onSnooze }: FocusSpotlightProps) {
  const urgency = getUrgencyInfo(task);

  return (
    <motion.div
      className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/40 shadow-lg p-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      {/* Urgency + overdue row */}
      <div className="flex items-center justify-between mb-4">
        {urgency && (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
              urgency.variant === "destructive" &&
                "bg-destructive/10 text-destructive",
              urgency.variant === "warning" &&
                "bg-amber-500/10 text-amber-600 dark:text-amber-400",
              urgency.variant === "default" &&
                "bg-primary/10 text-primary"
            )}
          >
            <AlertTriangle className="h-3 w-3" />
            {urgency.label}
          </span>
        )}
        {urgency?.sublabel && (
          <span className="text-xs text-destructive font-medium">
            {urgency.sublabel}
          </span>
        )}
      </div>

      {/* Task title */}
      <h2 className="text-2xl font-medium text-foreground leading-snug mb-2">
        {task.content}
      </h2>

      {/* Context anchor */}
      {task.linkedEntity && (
        <p className="text-sm text-muted-foreground mb-6">
          {task.linkedEntity.name}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          size="sm"
          onClick={() => onComplete(task.id)}
          className="gap-2"
        >
          <Check className="h-4 w-4" />
          Mark Complete
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSnooze(task.id)}
          className="gap-2 text-muted-foreground"
        >
          <Clock className="h-4 w-4" />
          Snooze
        </Button>
      </div>
    </motion.div>
  );
}
