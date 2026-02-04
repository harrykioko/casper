import { useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EnrichedTask } from "@/hooks/useEnrichedTasks";
import { HeroTaskCard } from "./HeroTaskCard";
import { SecondaryTaskCard } from "./SecondaryTaskCard";
import { parseISO, isToday, isTomorrow, isPast } from "date-fns";

interface UpNextSectionProps {
  tasks: EnrichedTask[];
  onComplete: (id: string) => void;
  onSnooze: (id: string, until: Date) => void;
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

export function UpNextSection({
  tasks,
  onComplete,
  onSnooze,
  onClick,
  maxTasks = 3,
}: UpNextSectionProps) {
  // Select top tasks for "Up Next" section
  const upNextTasks = useMemo(() => {
    const candidates = tasks.filter(t => !t.completed && !t.archived_at);

    // 1. Overdue tasks (sorted by how overdue)
    const overdue = candidates
      .filter(t => isOverdue(t.scheduledFor))
      .sort((a, b) => {
        const aDate = a.scheduledFor ? parseISO(a.scheduledFor).getTime() : Infinity;
        const bDate = b.scheduledFor ? parseISO(b.scheduledFor).getTime() : Infinity;
        return aDate - bDate;
      });

    // 2. Due today (sorted by priority)
    const dueToday = candidates
      .filter(t => isDueToday(t.scheduledFor))
      .sort((a, b) => getPriorityScore(a.priority) - getPriorityScore(b.priority));

    // 3. High priority due tomorrow
    const highTomorrow = candidates
      .filter(t => isDueTomorrow(t.scheduledFor) && t.priority === 'high');

    // 4. High priority no date (fallback)
    const highPriorityNoDate = candidates
      .filter(t => !t.scheduledFor && t.priority === 'high')
      .slice(0, 2);

    // Combine and dedupe
    const combined = [...overdue, ...dueToday, ...highTomorrow, ...highPriorityNoDate];
    
    const seen = new Set<string>();
    return combined.filter(t => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    }).slice(0, maxTasks);
  }, [tasks, maxTasks]);

  if (upNextTasks.length === 0) {
    return null;
  }

  const heroTask = upNextTasks[0];
  const secondaryTasks = upNextTasks.slice(1);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className={cn(
          "flex items-center justify-center w-6 h-6 rounded-lg",
          "bg-primary/10"
        )}>
          <CircleDot className="h-3.5 w-3.5 text-primary" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">Up Next</h2>
      </div>

      {/* Cards layout */}
      <div className="flex gap-4 flex-wrap">
        <AnimatePresence mode="popLayout">
          {/* Hero card - first task */}
          <HeroTaskCard
            key={heroTask.id}
            task={heroTask}
            onComplete={onComplete}
            onSnooze={onSnooze}
            onClick={onClick}
          />

          {/* Secondary cards */}
          {secondaryTasks.map((task) => (
            <SecondaryTaskCard
              key={task.id}
              task={task}
              onClick={onClick}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
