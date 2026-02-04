import { useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EnrichedTask } from "@/hooks/useEnrichedTasks";
import { TodayTaskCard } from "./TodayTaskCard";
import { parseISO, isToday, isTomorrow, isPast } from "date-fns";

interface TodayLaneProps {
  tasks: EnrichedTask[];
  onComplete: (id: string) => void;
  onSnooze: (id: string, until: Date) => void;
  onReschedule: (id: string, date: Date) => void;
  onUpdatePriority: (id: string, priority: string) => void;
  onUpdateEffort: (id: string, minutes: number, category: string) => void;
  onClick: (task: EnrichedTask) => void;
  maxTasks?: number;
}

function isOverdue(dateString?: string): boolean {
  if (!dateString) return false;
  const date = parseISO(dateString);
  return isPast(date) && !isToday(date);
}

function isDueToday(dateString?: string): boolean {
  if (!dateString) return false;
  return isToday(parseISO(dateString));
}

function isDueTomorrow(dateString?: string): boolean {
  if (!dateString) return false;
  return isTomorrow(parseISO(dateString));
}

const priorityOrder = { high: 0, medium: 1, low: 2 };

function getPriorityScore(priority?: string): number {
  return priorityOrder[priority as keyof typeof priorityOrder] ?? 3;
}

export function TodayLane({
  tasks,
  onComplete,
  onSnooze,
  onReschedule,
  onUpdatePriority,
  onUpdateEffort,
  onClick,
  maxTasks = 5,
}: TodayLaneProps) {
  // Select tasks for Today lane using priority rules
  const todayTasks = useMemo(() => {
    const candidates = tasks.filter(t => !t.completed && !t.archived_at);

    // 1. Overdue tasks (sorted by how overdue)
    const overdue = candidates
      .filter(t => isOverdue(t.scheduledFor))
      .sort((a, b) => {
        const aDate = a.scheduledFor ? parseISO(a.scheduledFor).getTime() : Infinity;
        const bDate = b.scheduledFor ? parseISO(b.scheduledFor).getTime() : Infinity;
        return aDate - bDate;
      });

    // 2. Due today (sorted by priority, then effort)
    const dueToday = candidates
      .filter(t => isDueToday(t.scheduledFor))
      .sort((a, b) => {
        const pDiff = getPriorityScore(a.priority) - getPriorityScore(b.priority);
        if (pDiff !== 0) return pDiff;
        // Shorter effort first
        return (a.effort_minutes || 999) - (b.effort_minutes || 999);
      });

    // 3. High priority due tomorrow
    const highTomorrow = candidates
      .filter(t => isDueTomorrow(t.scheduledFor) && t.priority === 'high')
      .sort((a, b) => (a.effort_minutes || 999) - (b.effort_minutes || 999));

    // 4. High priority no date (fallback)
    const highPriorityNoDate = candidates
      .filter(t => !t.scheduledFor && t.priority === 'high')
      .slice(0, 2);

    // Combine and take first N
    const combined = [...overdue, ...dueToday, ...highTomorrow, ...highPriorityNoDate];
    
    // Dedupe by ID
    const seen = new Set<string>();
    return combined.filter(t => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    }).slice(0, maxTasks);
  }, [tasks, maxTasks]);

  if (todayTasks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className={cn(
          "flex items-center justify-center w-6 h-6 rounded-lg",
          "bg-amber-500/10"
        )}>
          <Zap className="h-3.5 w-3.5 text-amber-500" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">Today</h2>
        <span className="text-xs text-muted-foreground">
          {todayTasks.length} task{todayTasks.length !== 1 ? 's' : ''} to focus on
        </span>
      </div>

      {/* Horizontal scrolling lane */}
      <div className="relative -mx-2 px-2">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted/30">
          <AnimatePresence mode="popLayout">
            {todayTasks.map((task) => (
              <TodayTaskCard
                key={task.id}
                task={task}
                onComplete={onComplete}
                onSnooze={onSnooze}
                onReschedule={onReschedule}
                onUpdatePriority={onUpdatePriority}
                onUpdateEffort={onUpdateEffort}
                onClick={onClick}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
