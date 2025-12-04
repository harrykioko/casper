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
    <div className="bg-card/60 border border-border/40 rounded-xl p-4 backdrop-blur-sm space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Tasks</h4>
        {tasks.length > 0 && (
          <span className="text-sm text-muted-foreground">{tasks.length} open</span>
        )}
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No open tasks</p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30 group"
            >
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => onToggleComplete(task.id)}
                className="h-4 w-4"
              />
              <span className={`text-base flex-1 truncate ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {task.content}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Quick add */}
      <form onSubmit={handleAddTask} className="flex items-center gap-2">
        <Input
          placeholder="Add a task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          className="h-9 text-sm"
          disabled={isAdding}
        />
        <Button type="submit" size="sm" variant="secondary" disabled={isAdding || !newTask.trim()}>
          <Plus className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
