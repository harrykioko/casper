import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { CompanyTask } from '@/hooks/useCompanyTasks';

interface CompanyCommandTasksProps {
  tasks: CompanyTask[];
  companyId: string;
  onCreateTask: (content: string) => Promise<unknown>;
  onToggleComplete: (taskId: string) => Promise<unknown>;
}

export function CompanyCommandTasks({ tasks, companyId, onCreateTask, onToggleComplete }: CompanyCommandTasksProps) {
  const [newTask, setNewTask] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    
    setIsAdding(true);
    try {
      await onCreateTask(newTask.trim());
      setNewTask('');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-card/50 border border-border/30 rounded-xl p-3 backdrop-blur-sm space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Tasks</h4>
        {tasks.length > 0 && (
          <span className="text-xs text-muted-foreground">{tasks.length} open</span>
        )}
      </div>

      {/* Task list */}
      <div className="space-y-1.5">
        {tasks.length === 0 ? (
          <p className="text-xs text-muted-foreground py-1">No open tasks</p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/30 group hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => onToggleComplete(task.id)}
                className="h-3.5 w-3.5"
              />
              <span className={`text-sm flex-1 truncate ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {task.content}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Quick add */}
      <form onSubmit={handleAddTask} className="flex items-center gap-1.5">
        <Input
          data-task-input
          placeholder="Add a task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          className="h-8 text-sm"
          disabled={isAdding}
        />
        <Button type="submit" size="sm" variant="secondary" className="h-8 px-2" disabled={isAdding || !newTask.trim()}>
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </form>
    </div>
  );
}
