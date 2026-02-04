import { useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { Calendar, Clock, CalendarDays, CalendarRange } from "lucide-react";
import type { EnrichedTask } from "@/hooks/useEnrichedTasks";
import { TaskRowCard } from "./TaskRowCard";
import { parseISO, isToday, isTomorrow, isPast, differenceInDays, addDays, format } from "date-fns";
import { cn } from "@/lib/utils";

interface TaskGroupedListProps {
  tasks: EnrichedTask[];
  excludeIds?: Set<string>; // Tasks to exclude (e.g., already in Up Next)
  onTaskComplete: (id: string) => void;
  onTaskDelete: (id: string) => void;
  onTaskClick: (task: EnrichedTask) => void;
  onSnooze: (id: string, until: Date) => void;
  onReschedule: (id: string, date: Date) => void;
  onUpdatePriority: (id: string, priority: string) => void;
  onUpdateEffort: (id: string, minutes: number, category: string) => void;
  onArchive?: (id: string) => void;
}

interface TaskGroup {
  id: string;
  label: string;
  sublabel?: string;
  tasks: EnrichedTask[];
  variant: 'prominent' | 'default' | 'muted';
  icon: typeof Calendar;
  iconColor: string;
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

function isThisWeek(dateString?: string): boolean {
  if (!dateString) return false;
  const date = parseISO(dateString);
  const daysFromNow = differenceInDays(date, new Date());
  return daysFromNow >= 2 && daysFromNow <= 7;
}

function isUpcoming(dateString?: string): boolean {
  if (!dateString) return false;
  const date = parseISO(dateString);
  const daysFromNow = differenceInDays(date, new Date());
  return daysFromNow > 7;
}

export function TaskGroupedList({
  tasks,
  excludeIds = new Set(),
  onTaskComplete,
  onTaskDelete,
  onTaskClick,
  onSnooze,
  onReschedule,
  onUpdatePriority,
  onUpdateEffort,
  onArchive,
}: TaskGroupedListProps) {
  const taskGroups = useMemo(() => {
    const groups: TaskGroup[] = [];
    const assigned = new Set<string>();

    // Filter out excluded tasks (already in Up Next)
    const availableTasks = tasks.filter(t => !excludeIds.has(t.id));

    // 1. Overdue
    const overdue = availableTasks.filter(t => {
      if (assigned.has(t.id)) return false;
      if (isOverdue(t.scheduledFor)) {
        assigned.add(t.id);
        return true;
      }
      return false;
    }).sort((a, b) => {
      const aDate = a.scheduledFor ? parseISO(a.scheduledFor).getTime() : Infinity;
      const bDate = b.scheduledFor ? parseISO(b.scheduledFor).getTime() : Infinity;
      return aDate - bDate;
    });

    if (overdue.length > 0) {
      groups.push({
        id: 'overdue',
        label: 'Overdue',
        tasks: overdue,
        variant: 'prominent',
        icon: Clock,
        iconColor: 'text-rose-500',
      });
    }

    // 2. Due Today
    const dueToday = availableTasks.filter(t => {
      if (assigned.has(t.id)) return false;
      if (isDueToday(t.scheduledFor)) {
        assigned.add(t.id);
        return true;
      }
      return false;
    });

    if (dueToday.length > 0) {
      groups.push({
        id: 'today',
        label: 'Today',
        tasks: dueToday,
        variant: 'prominent',
        icon: Calendar,
        iconColor: 'text-amber-500',
      });
    }

    // 3. Due Tomorrow
    const dueTomorrow = availableTasks.filter(t => {
      if (assigned.has(t.id)) return false;
      if (isDueTomorrow(t.scheduledFor)) {
        assigned.add(t.id);
        return true;
      }
      return false;
    });

    if (dueTomorrow.length > 0) {
      groups.push({
        id: 'tomorrow',
        label: 'Tomorrow',
        sublabel: format(addDays(new Date(), 1), 'EEEE'),
        tasks: dueTomorrow,
        variant: 'default',
        icon: CalendarDays,
        iconColor: 'text-sky-500',
      });
    }

    // 4. This Week
    const thisWeek = availableTasks.filter(t => {
      if (assigned.has(t.id)) return false;
      if (isThisWeek(t.scheduledFor)) {
        assigned.add(t.id);
        return true;
      }
      return false;
    }).sort((a, b) => {
      const aDate = a.scheduledFor ? parseISO(a.scheduledFor).getTime() : Infinity;
      const bDate = b.scheduledFor ? parseISO(b.scheduledFor).getTime() : Infinity;
      return aDate - bDate;
    });

    if (thisWeek.length > 0) {
      groups.push({
        id: 'this-week',
        label: 'This Week',
        tasks: thisWeek,
        variant: 'default',
        icon: CalendarRange,
        iconColor: 'text-muted-foreground',
      });
    }

    // 5. Upcoming (with date, beyond this week)
    const upcoming = availableTasks.filter(t => {
      if (assigned.has(t.id)) return false;
      if (isUpcoming(t.scheduledFor)) {
        assigned.add(t.id);
        return true;
      }
      return false;
    }).sort((a, b) => {
      const aDate = a.scheduledFor ? parseISO(a.scheduledFor).getTime() : Infinity;
      const bDate = b.scheduledFor ? parseISO(b.scheduledFor).getTime() : Infinity;
      return aDate - bDate;
    });

    if (upcoming.length > 0) {
      groups.push({
        id: 'upcoming',
        label: 'Upcoming',
        tasks: upcoming,
        variant: 'muted',
        icon: CalendarRange,
        iconColor: 'text-muted-foreground/60',
      });
    }

    // 6. No Date (backlog) - sorted by priority
    const noDate = availableTasks.filter(t => !assigned.has(t.id)).sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const aPrio = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3;
      const bPrio = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3;
      return aPrio - bPrio;
    });

    if (noDate.length > 0) {
      groups.push({
        id: 'no-date',
        label: 'No Date',
        tasks: noDate,
        variant: 'muted',
        icon: Calendar,
        iconColor: 'text-muted-foreground/50',
      });
    }

    return groups;
  }, [tasks, excludeIds]);

  if (tasks.length === 0 || taskGroups.every(g => g.tasks.length === 0)) {
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
        <div key={group.id}>
          {/* Section Header */}
          <div className="flex items-center gap-2 mb-2">
            <group.icon className={cn("h-4 w-4", group.iconColor)} />
            <span className={cn(
              "text-xs font-semibold uppercase tracking-wide",
              group.variant === 'muted' ? "text-muted-foreground/60" : "text-muted-foreground"
            )}>
              {group.label}
            </span>
            {group.sublabel && (
              <span className="text-[10px] text-muted-foreground/50">
                {group.sublabel}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground/50 ml-auto">
              {group.tasks.length}
            </span>
          </div>

          {/* Task Rows */}
          <div className="space-y-1.5">
            <AnimatePresence mode="popLayout">
              {group.tasks.map((task) => (
                <TaskRowCard
                  key={task.id}
                  task={task}
                  variant={group.variant}
                  onComplete={onTaskComplete}
                  onDelete={onTaskDelete}
                  onSnooze={onSnooze}
                  onReschedule={onReschedule}
                  onUpdatePriority={onUpdatePriority}
                  onUpdateEffort={onUpdateEffort}
                  onArchive={onArchive}
                  onClick={onTaskClick}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      ))}
    </div>
  );
}
