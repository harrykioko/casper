import { useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { Task } from "@/hooks/useTasks";
import { TaskWorkCard } from "./TaskWorkCard";
import { parseISO, differenceInDays, isToday, isTomorrow, isPast } from "date-fns";
import { cn } from "@/lib/utils";

interface TaskGroupedListProps {
  tasks: Task[];
  onTaskComplete: (id: string) => void;
  onTaskDelete: (id: string) => void;
  onTaskClick: (task: Task) => void;
  onQuickUpdate?: (id: string, updates: Partial<Task>) => void;
}

interface TaskGroup {
  label: string;
  tasks: Task[];
  priority: number;
}

function isWithinDays(dateString: string | undefined, days: number): boolean {
  if (!dateString) return false;
  const date = parseISO(dateString);
  const now = new Date();
  const diff = differenceInDays(date, now);
  return diff >= -1 && diff <= days; // Include overdue by 1 day
}

function isOverdue(dateString: string | undefined): boolean {
  if (!dateString) return false;
  const date = parseISO(dateString);
  return isPast(date) && !isToday(date);
}

export function TaskGroupedList({ 
  tasks, 
  onTaskComplete, 
  onTaskDelete, 
  onTaskClick,
  onQuickUpdate 
}: TaskGroupedListProps) {
  const taskGroups = useMemo(() => {
    const groups: TaskGroup[] = [];
    const assignedIds = new Set<string>();

    // 1. Due Soon (overdue, today, tomorrow, next 2 days)
    const dueSoon = tasks.filter(t => {
      if (assignedIds.has(t.id)) return false;
      const isDue = isWithinDays(t.scheduledFor, 2) || isOverdue(t.scheduledFor);
      if (isDue) assignedIds.add(t.id);
      return isDue;
    }).sort((a, b) => {
      // Overdue first, then by date
      const aOverdue = isOverdue(a.scheduledFor) ? -1 : 0;
      const bOverdue = isOverdue(b.scheduledFor) ? -1 : 0;
      if (aOverdue !== bOverdue) return aOverdue - bOverdue;
      const aDate = a.scheduledFor ? parseISO(a.scheduledFor).getTime() : Infinity;
      const bDate = b.scheduledFor ? parseISO(b.scheduledFor).getTime() : Infinity;
      return aDate - bDate;
    });

    if (dueSoon.length > 0) {
      groups.push({ label: "Due Soon", tasks: dueSoon, priority: 1 });
    }

    // 2. Next Up (high/medium priority, not in due soon)
    const nextUp = tasks.filter(t => {
      if (assignedIds.has(t.id)) return false;
      const isHighMed = t.priority === "high" || t.priority === "medium";
      if (isHighMed) assignedIds.add(t.id);
      return isHighMed;
    }).sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const aPrio = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3;
      const bPrio = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3;
      return aPrio - bPrio;
    });

    if (nextUp.length > 0) {
      groups.push({ label: "Next Up", tasks: nextUp, priority: 2 });
    }

    // 3. Later (everything else)
    const later = tasks.filter(t => !assignedIds.has(t.id));

    if (later.length > 0) {
      groups.push({ label: "Later", tasks: later, priority: 3 });
    }

    return groups;
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
          <div className="grid grid-cols-2 gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-primary/60" />
            <div className="w-3 h-3 rounded-sm bg-muted-foreground/30" />
            <div className="w-3 h-3 rounded-sm bg-muted-foreground/30" />
            <div className="w-3 h-3 rounded-sm bg-muted-foreground/30" />
          </div>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">All clear</h3>
        <p className="text-sm text-muted-foreground">No tasks to show. Add one to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {taskGroups.map((group) => (
        <div key={group.label}>
          {/* Section Header */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </span>
            <span className="text-[10px] text-muted-foreground/60">
              {group.tasks.length}
            </span>
          </div>

          {/* Task Cards */}
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {group.tasks.map((task) => (
                <TaskWorkCard
                  key={task.id}
                  task={task}
                  onComplete={onTaskComplete}
                  onDelete={onTaskDelete}
                  onClick={onTaskClick}
                  onQuickUpdate={onQuickUpdate}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      ))}
    </div>
  );
}
