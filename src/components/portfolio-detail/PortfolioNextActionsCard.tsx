import { Check, Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassPanel, GlassPanelHeader } from '@/components/ui/glass-panel';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { CompanyTask } from '@/hooks/useCompanyTasks';

interface PortfolioNextActionsCardProps {
  tasks: CompanyTask[];
  onToggleComplete: (taskId: string) => Promise<boolean>;
  onAddTask?: () => void;
}

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'MMM d');
}

export function PortfolioNextActionsCard({ tasks, onToggleComplete, onAddTask }: PortfolioNextActionsCardProps) {
  // Filter open tasks, sort by due date
  const openTasks = tasks
    .filter(t => !t.completed)
    .sort((a, b) => {
      if (!a.scheduled_for && !b.scheduled_for) return 0;
      if (!a.scheduled_for) return 1;
      if (!b.scheduled_for) return -1;
      
      const aDate = new Date(a.scheduled_for);
      const bDate = new Date(b.scheduled_for);
      const aOverdue = isPast(aDate) && !isToday(aDate);
      const bOverdue = isPast(bDate) && !isToday(bDate);
      
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      return aDate.getTime() - bDate.getTime();
    })
    .slice(0, 3);

  return (
    <GlassPanel>
      <GlassPanelHeader 
        title="Next Actions" 
        action={onAddTask && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onAddTask}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      />
      
      <div className="p-4 pt-0">
        {openTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No open tasks
          </p>
        ) : (
          <div className="space-y-2">
            {openTasks.map((task) => {
              const isOverdue = task.scheduled_for && isPast(new Date(task.scheduled_for)) && !isToday(new Date(task.scheduled_for));
              
              return (
                <div 
                  key={task.id}
                  className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 flex-shrink-0 mt-0.5 opacity-60 group-hover:opacity-100"
                    onClick={() => onToggleComplete(task.id)}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </Button>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-2">{task.content}</p>
                    {task.scheduled_for && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className={`text-xs ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                          {formatDueDate(task.scheduled_for)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
