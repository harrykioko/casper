import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { EnrichedTask } from "@/hooks/useEnrichedTasks";
import { EntityPill } from "./EntityPill";
import { format, parseISO, isToday, isTomorrow, isPast } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { addHours, addDays, setHours, setMinutes, nextMonday } from "date-fns";

interface HeroTaskCardProps {
  task: EnrichedTask;
  onComplete: (id: string) => void;
  onSnooze: (id: string, until: Date) => void;
  onClick: (task: EnrichedTask) => void;
}

function isOverdue(dateString?: string): boolean {
  if (!dateString) return false;
  const date = parseISO(dateString);
  return isPast(date) && !isToday(date);
}

function getDueLabel(dateString?: string): { label: string; urgent: boolean } | null {
  if (!dateString) return null;
  const date = parseISO(dateString);
  
  if (isOverdue(dateString)) {
    return { label: "Overdue", urgent: true };
  }
  if (isToday(date)) {
    return { label: "Today", urgent: false };
  }
  if (isTomorrow(date)) {
    return { label: "Tomorrow", urgent: false };
  }
  return { label: format(date, "MMM d"), urgent: false };
}

const SNOOZE_OPTIONS = [
  { label: "In 1 hour", hours: 1 },
  { label: "In 4 hours", hours: 4 },
  { label: "Tomorrow morning", hours: null, tomorrow: true },
  { label: "Next week", hours: null, nextWeek: true },
];

function getSnoozeTime(option: typeof SNOOZE_OPTIONS[0]): Date {
  const now = new Date();
  if (option.hours) {
    return addHours(now, option.hours);
  }
  if (option.tomorrow) {
    return setMinutes(setHours(addDays(now, 1), 9), 0);
  }
  if (option.nextWeek) {
    return setMinutes(setHours(nextMonday(now), 9), 0);
  }
  return addHours(now, 1);
}

export function HeroTaskCard({
  task,
  onComplete,
  onSnooze,
  onClick,
}: HeroTaskCardProps) {
  const [isExiting, setIsExiting] = useState(false);

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExiting(true);
    setTimeout(() => onComplete(task.id), 300);
  };

  const dueInfo = getDueLabel(task.scheduledFor);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isExiting ? 0 : 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      onClick={() => onClick(task)}
      className={cn(
        "flex-1 max-w-xl rounded-2xl p-5 cursor-pointer",
        "bg-card",
        "border border-border",
        "shadow-sm",
        "hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
      )}
    >
      {/* Context pills at top */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {task.linkedEntity && <EntityPill entity={task.linkedEntity} size="md" />}
        {dueInfo && (
          <span className={cn(
            "inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium",
            dueInfo.urgent 
              ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
              : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
          )}>
            <Calendar className="h-3 w-3" />
            {dueInfo.label}
          </span>
        )}
      </div>

      {/* Large title */}
      <h3 className="text-lg font-semibold text-foreground leading-snug mb-2">
        {task.content}
      </h3>

      {/* Bottom actions */}
      <div className="flex items-center justify-between mt-5 pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          {/* Priority indicator - subtle */}
          {task.priority === 'high' && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
              P1
            </span>
          )}
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                <Clock className="h-3.5 w-3.5" />
                Snooze
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {SNOOZE_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.label}
                  onClick={() => onSnooze(task.id, getSnoozeTime(option))}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" onClick={handleComplete} className="gap-1.5">
            <Check className="h-3.5 w-3.5" />
            Complete
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
