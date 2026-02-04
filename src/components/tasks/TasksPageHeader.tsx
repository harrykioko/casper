import { useMemo } from "react";
import { Plus, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Task } from "@/hooks/useTasks";
import { isToday, parseISO, differenceInDays } from "date-fns";

interface TasksPageHeaderProps {
  tasks: Task[];
  onAddTaskClick?: () => void;
}

export function TasksPageHeader({ tasks, onAddTaskClick }: TasksPageHeaderProps) {
  const stats = useMemo(() => {
    const now = new Date();
    
    // Ready tasks: not done, not completed
    const readyTasks = tasks.filter(t => t.status !== 'done' && !t.completed);
    
    // Due soon: within next 3 days
    const dueSoon = readyTasks.filter(t => {
      if (!t.scheduledFor) return false;
      const scheduledDate = parseISO(t.scheduledFor);
      const daysUntil = differenceInDays(scheduledDate, now);
      return daysUntil >= 0 && daysUntil <= 3;
    });
    
    // Completed today
    const completedToday = tasks.filter(t => {
      if (!t.completed || !t.completed_at) return false;
      return isToday(parseISO(t.completed_at));
    });
    
    return {
      ready: readyTasks.length,
      dueSoon: dueSoon.length,
      completedToday: completedToday.length,
    };
  }, [tasks]);

  const buildSubtext = () => {
    const parts: string[] = [];
    if (stats.ready > 0) {
      parts.push(`${stats.ready} task${stats.ready !== 1 ? 's' : ''} ready`);
    }
    if (stats.dueSoon > 0) {
      parts.push(`${stats.dueSoon} due soon`);
    }
    if (stats.completedToday > 0) {
      parts.push(`${stats.completedToday} completed today`);
    }
    return parts.length > 0 ? parts.join(' · ') : 'No tasks yet';
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Your Work</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{buildSubtext()}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex items-center gap-1.5 text-muted-foreground"
          onClick={() => {
            // Trigger command palette
            const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
            window.dispatchEvent(event);
          }}
        >
          <Command className="h-3.5 w-3.5" />
          <span className="text-xs">K</span>
        </Button>
        <Button
          size="sm"
          onClick={onAddTaskClick}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>
    </div>
  );
}
