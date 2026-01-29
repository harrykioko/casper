import { Check, AlertCircle, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlassPanel, GlassPanelHeader } from '@/components/ui/glass-panel';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { useTasks } from '@/hooks/useTasks';

interface Task {
  id: string;
  content: string;
  completed: boolean;
  scheduled_for?: string | null;
  priority?: string | null;
}

interface NextActionsCardProps {
  tasks: Task[];
  nextSteps?: string | null;
}

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'MMM d');
}

export function NextActionsCard({ tasks, nextSteps }: NextActionsCardProps) {
  const { updateTask } = useTasks();

  // Sort tasks: overdue first, then by due date
  const sortedTasks = [...tasks]
    .filter(t => t.scheduled_for)
    .sort((a, b) => {
      const aDate = new Date(a.scheduled_for!);
      const bDate = new Date(b.scheduled_for!);
      const aOverdue = isPast(aDate) && !isToday(aDate);
      const bOverdue = isPast(bDate) && !isToday(bDate);
      
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      return aDate.getTime() - bDate.getTime();
    })
    .slice(0, 5);

  const handleComplete = async (taskId: string) => {
    await updateTask(taskId, { completed: true, completed_at: new Date().toISOString() });
  };

  const hasContent = sortedTasks.length > 0 || nextSteps;

  return (
    <GlassPanel>
      <GlassPanelHeader title="Next Actions" />
      
      <div className="p-4">
        {!hasContent ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No upcoming actions
          </p>
        ) : (
          <div className="space-y-2">
            {/* Prioritized tasks */}
            {sortedTasks.map((task) => {
              const isOverdue = task.scheduled_for && isPast(new Date(task.scheduled_for)) && !isToday(new Date(task.scheduled_for));
              
              return (
                <div 
                  key={task.id}
                  className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 flex-shrink-0 mt-0.5"
                    onClick={() => handleComplete(task.id)}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </Button>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-2">{task.content}</p>
                    {task.scheduled_for && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className={`text-xs ${isOverdue ? 'text-rose-500 font-medium' : 'text-muted-foreground'}`}>
                          {formatDueDate(task.scheduled_for)}
                        </span>
                        {isOverdue && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                            Overdue
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Next steps fallback if no tasks with dates */}
            {sortedTasks.length === 0 && nextSteps && (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Next Steps</p>
                  <p className="text-sm text-foreground line-clamp-3">{nextSteps}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
