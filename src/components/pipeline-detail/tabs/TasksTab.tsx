import { useState } from 'react';
import { Plus, Check, Trash2, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlassPanel, GlassPanelHeader, GlassSubcard } from '@/components/ui/glass-panel';
import { Badge } from '@/components/ui/badge';
import { format, isPast, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

interface PipelineTask {
  id: string;
  content: string;
  completed: boolean;
  scheduled_for?: string | null;
  priority?: string | null;
  completed_at?: string | null;
}

interface TasksTabProps {
  companyId: string;
  tasks: PipelineTask[];
  isLoading: boolean;
  onCreateTask: (content: string, options?: { scheduled_for?: string; priority?: string }) => Promise<any>;
  onUpdateTask: (taskId: string, updates: Partial<PipelineTask>) => Promise<any>;
  onDeleteTask: (taskId: string) => Promise<any>;
}

const priorityColors: Record<string, string> = {
  high: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  low: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
};

export function TasksTab({
  companyId,
  tasks,
  isLoading,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
}: TasksTabProps) {
  const [newTaskContent, setNewTaskContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddTask = async () => {
    if (!newTaskContent.trim()) return;
    
    setIsAdding(true);
    try {
      await onCreateTask(newTaskContent.trim());
      setNewTaskContent('');
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleComplete = async (task: PipelineTask) => {
    await onUpdateTask(task.id, {
      completed: !task.completed,
      completed_at: !task.completed ? new Date().toISOString() : null,
    });
  };

  const openTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Task */}
      <GlassPanel>
        <div className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/50">
              <Plus className="w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                value={newTaskContent}
                onChange={(e) => setNewTaskContent(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                placeholder="Add a new task..."
                className="flex-1 border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                disabled={isAdding}
              />
            </div>
            <Button onClick={handleAddTask} disabled={!newTaskContent.trim() || isAdding}>
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
            </Button>
          </div>
        </div>
      </GlassPanel>

      {/* Open Tasks */}
      <GlassPanel>
        <GlassPanelHeader title={`Open Tasks (${openTasks.length})`} />
        <div className="p-4">
          {openTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No open tasks. Add one above!
            </p>
          ) : (
            <div className="space-y-2">
              {openTasks.map((task) => {
                const isOverdue = task.scheduled_for && isPast(new Date(task.scheduled_for)) && !isToday(new Date(task.scheduled_for));
                
                return (
                  <GlassSubcard key={task.id} className="flex items-start gap-3 p-3 group">
                    <button
                      onClick={() => handleToggleComplete(task)}
                      className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                        "border-muted-foreground/30 hover:border-primary hover:bg-primary/10"
                      )}
                    >
                      {task.completed && <Check className="w-3 h-3 text-primary" />}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{task.content}</p>
                      
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {task.scheduled_for && (
                          <span className={cn(
                            "text-xs flex items-center gap-1",
                            isOverdue ? "text-rose-500" : "text-muted-foreground"
                          )}>
                            <Calendar className="w-3 h-3" />
                            {format(new Date(task.scheduled_for), 'MMM d')}
                            {isOverdue && <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4 ml-1">Overdue</Badge>}
                          </span>
                        )}
                        
                        {task.priority && (
                          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", priorityColors[task.priority])}>
                            {task.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-rose-500"
                      onClick={() => onDeleteTask(task.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </GlassSubcard>
                );
              })}
            </div>
          )}
        </div>
      </GlassPanel>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <GlassPanel>
          <GlassPanelHeader title={`Completed (${completedTasks.length})`} />
          <div className="p-4">
            <div className="space-y-2">
              {completedTasks.slice(0, 10).map((task) => (
                <GlassSubcard key={task.id} className="flex items-start gap-3 p-3 group opacity-60">
                  <button
                    onClick={() => handleToggleComplete(task)}
                    className="w-5 h-5 rounded border-2 border-primary bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5"
                  >
                    <Check className="w-3 h-3 text-primary" />
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground line-through">{task.content}</p>
                    {task.completed_at && (
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Completed {format(new Date(task.completed_at), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </GlassSubcard>
              ))}
            </div>
          </div>
        </GlassPanel>
      )}
    </div>
  );
}
