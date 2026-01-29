import { useState } from 'react';
import { Plus, Circle, ArrowRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/components/ui/glass-panel';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { cn } from '@/lib/utils';

interface PipelineTask {
  id: string;
  content: string;
  completed: boolean;
  scheduled_for?: string | null;
  priority?: string | null;
}

interface MomentumPanelProps {
  tasks: PipelineTask[];
  nextSteps?: string | null;
  onCreateTask: (content: string) => Promise<any>;
  onViewAllTasks: () => void;
}

function formatDueLabel(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEE, MMM d');
}

export function MomentumPanel({ 
  tasks, 
  nextSteps, 
  onCreateTask, 
  onViewAllTasks 
}: MomentumPanelProps) {
  const [input, setInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Get open tasks sorted by urgency (overdue first, then by date)
  const openTasks = tasks
    .filter(t => !t.completed)
    .sort((a, b) => {
      // Tasks with dates first
      if (!a.scheduled_for && b.scheduled_for) return 1;
      if (a.scheduled_for && !b.scheduled_for) return -1;
      if (!a.scheduled_for && !b.scheduled_for) return 0;
      
      const aDate = new Date(a.scheduled_for!);
      const bDate = new Date(b.scheduled_for!);
      const aOverdue = isPast(aDate) && !isToday(aDate);
      const bOverdue = isPast(bDate) && !isToday(bDate);
      
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      return aDate.getTime() - bDate.getTime();
    });

  const visibleTasks = openTasks.slice(0, 3);
  const hasMoreTasks = openTasks.length > 3;
  const hasAnyTasks = openTasks.length > 0;

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setIsAdding(true);
    try {
      await onCreateTask(input.trim());
      setInput('');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <GlassPanel padding="md">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h3 className="text-base font-semibold text-foreground">Momentum</h3>
          <p className="text-sm text-muted-foreground">What's next for this deal?</p>
        </div>

        {/* Quick add input */}
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/50 focus-within:border-border transition-colors">
          <Plus className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
            placeholder={hasAnyTasks ? "Add another task..." : "Capture your first next step..."}
            className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
            disabled={isAdding}
          />
          {input.trim() && (
            <Button 
              size="sm" 
              onClick={handleSubmit} 
              disabled={isAdding}
              className="h-7 px-2.5"
            >
              Add
            </Button>
          )}
        </div>

        {/* Task list or fallback */}
        {hasAnyTasks ? (
          <div className="space-y-1">
            {visibleTasks.map((task) => {
              const isOverdue = task.scheduled_for && isPast(new Date(task.scheduled_for)) && !isToday(new Date(task.scheduled_for));
              
              return (
                <div 
                  key={task.id}
                  className="flex items-center gap-3 py-2 px-1 group"
                >
                  <Circle className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
                  
                  <span className="flex-1 text-sm text-foreground truncate">
                    {task.content}
                  </span>
                  
                  {task.scheduled_for && (
                    <span className={cn(
                      "text-xs flex-shrink-0",
                      isOverdue ? "text-destructive font-medium" : "text-muted-foreground"
                    )}>
                      {isOverdue && "⚠ "}
                      {formatDueLabel(task.scheduled_for)}
                    </span>
                  )}
                </div>
              );
            })}

            {/* View all link */}
            {hasMoreTasks && (
              <button
                onClick={onViewAllTasks}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors pt-1"
              >
                View all {openTasks.length} tasks
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : nextSteps ? (
          // Fallback to next_steps if no tasks
          <div className="py-2 px-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">Working Notes</p>
            <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-3">
              {nextSteps}
            </p>
          </div>
        ) : null}
      </div>
    </GlassPanel>
  );
}
