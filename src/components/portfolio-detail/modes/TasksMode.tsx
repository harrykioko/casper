import { useState } from 'react';
import { Plus, Trash2, CheckSquare, ChevronDown, ChevronRight } from 'lucide-react';
import { GlassPanel, GlassPanelHeader } from '@/components/ui/glass-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CompanyTask } from '@/hooks/useCompanyTasks';

interface TasksModeProps {
  tasks: CompanyTask[];
  loading: boolean;
  onCreateTask: (content: string) => Promise<CompanyTask | null>;
  onToggleComplete: (taskId: string) => Promise<boolean>;
  onDeleteTask: (taskId: string) => Promise<boolean>;
}

export function TasksMode({
  tasks,
  loading,
  onCreateTask,
  onToggleComplete,
  onDeleteTask,
}: TasksModeProps) {
  const [newTaskContent, setNewTaskContent] = useState('');
  const [creating, setCreating] = useState(false);
  const [completedOpen, setCompletedOpen] = useState(false);

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
    <div className="space-y-4">
      {/* Task input */}
      <GlassPanel>
        <GlassPanelHeader title="Add Task" />
        <form onSubmit={handleCreateTask} className="flex gap-2">
          <Input
            value={newTaskContent}
            onChange={(e) => setNewTaskContent(e.target.value)}
            placeholder="What needs to be done?"
            className="flex-1 h-10 bg-background/50"
            disabled={creating}
          />
          <Button
            type="submit"
            disabled={!newTaskContent.trim() || creating}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </form>
      </GlassPanel>

      {/* Open tasks */}
      <GlassPanel>
        <GlassPanelHeader 
          title="Open Tasks" 
          action={
            <span className="text-sm text-muted-foreground">
              {openTasks.length} {openTasks.length === 1 ? 'task' : 'tasks'}
            </span>
          }
        />
        
        {loading ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            Loading tasks...
          </div>
        ) : openTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
              <CheckSquare className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No open tasks. Add one above!
            </p>
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
          </div>
        )}
      </GlassPanel>

      {/* Completed tasks */}
      {completedTasks.length > 0 && (
        <Collapsible open={completedOpen} onOpenChange={setCompletedOpen}>
          <GlassPanel variant="subtle">
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors rounded-[28px]">
                <div className="flex items-center gap-2">
                  {completedOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">Completed</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {completedTasks.length}
                </span>
              </button>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-2">
                {completedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={() => onToggleComplete(task.id)}
                    onDelete={() => onDeleteTask(task.id)}
                  />
                ))}
              </div>
            </CollapsibleContent>
          </GlassPanel>
        </Collapsible>
      )}
    </div>
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
      className={`group flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors ${
        task.completed ? 'opacity-60' : ''
      }`}
    >
      <Checkbox
        checked={task.completed}
        onCheckedChange={onToggle}
        className="h-5 w-5"
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
        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
