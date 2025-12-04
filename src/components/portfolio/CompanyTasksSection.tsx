import { useState } from 'react';
import { Plus, Check, Circle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { CompanyTask } from '@/hooks/useCompanyTasks';
import { format } from 'date-fns';

interface CompanyTasksSectionProps {
  tasks: CompanyTask[];
  loading: boolean;
  onCreateTask: (content: string) => Promise<CompanyTask | null>;
  onToggleComplete: (taskId: string) => Promise<boolean>;
  onDeleteTask: (taskId: string) => Promise<boolean>;
}

export function CompanyTasksSection({
  tasks,
  loading,
  onCreateTask,
  onToggleComplete,
  onDeleteTask,
}: CompanyTasksSectionProps) {
  const [newTaskContent, setNewTaskContent] = useState('');
  const [creating, setCreating] = useState(false);

  const openTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskContent.trim()) return;

    setCreating(true);
    try {
      await onCreateTask(newTaskContent.trim());
      setNewTaskContent('');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center justify-between">
          <span>Tasks</span>
          <span className="text-sm font-normal text-muted-foreground">
            {openTasks.length} open
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add task form */}
        <form onSubmit={handleCreateTask} className="flex gap-2">
          <Input
            value={newTaskContent}
            onChange={(e) => setNewTaskContent(e.target.value)}
            placeholder="Add a task..."
            className="flex-1 h-9"
            disabled={creating}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!newTaskContent.trim() || creating}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </form>

        {/* Open tasks */}
        {loading ? (
          <div className="text-sm text-muted-foreground py-4 text-center">
            Loading tasks...
          </div>
        ) : openTasks.length === 0 && completedTasks.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4 text-center">
            No tasks yet. Add your first task above.
          </div>
        ) : (
          <div className="space-y-2">
            {openTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={() => onToggleComplete(task.id)}
                onDelete={() => onDeleteTask(task.id)}
              />
            ))}

            {completedTasks.length > 0 && (
              <>
                <div className="text-xs text-muted-foreground pt-2 pb-1">
                  Completed ({completedTasks.length})
                </div>
                {completedTasks.slice(0, 3).map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={() => onToggleComplete(task.id)}
                    onDelete={() => onDeleteTask(task.id)}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TaskItemProps {
  task: CompanyTask;
  onToggle: () => void;
  onDelete: () => void;
}

function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  return (
    <div
      className={`group flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors ${
        task.completed ? 'opacity-60' : ''
      }`}
    >
      <Checkbox
        checked={task.completed}
        onCheckedChange={onToggle}
        className="h-4 w-4"
      />
      <span
        className={`flex-1 text-sm ${
          task.completed ? 'line-through text-muted-foreground' : ''
        }`}
      >
        {task.content}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
