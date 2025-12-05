import { useState } from 'react';
import { CheckSquare, Plus, Circle, CheckCircle2 } from 'lucide-react';
import { useTasks, Task } from '@/hooks/useTasks';
import { DashboardTile } from './DashboardTile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface TodoListTileProps {
  onTaskClick: (task: Task) => void;
}

export function TodoListTile({ onTaskClick }: TodoListTileProps) {
  const { tasks, loading, createTask, updateTask } = useTasks();
  const [newTaskContent, setNewTaskContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Filter to show only incomplete tasks, limited to 8
  const openTasks = tasks.filter(task => !task.completed).slice(0, 8);

  const handleAddTask = async () => {
    if (!newTaskContent.trim()) return;
    
    setIsAdding(true);
    try {
      await createTask({
        content: newTaskContent.trim(),
        status: 'To Do',
      });
      setNewTaskContent('');
    } finally {
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddTask();
    }
  };

  const handleToggleComplete = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    await updateTask(task.id, { completed: true });
  };

  if (loading) {
    return (
      <DashboardTile title="To-Do List" icon={CheckSquare} colSpan={4}>
        <div className="space-y-2">
          <Skeleton className="h-9 w-full rounded-lg" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </DashboardTile>
    );
  }

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
      <CheckSquare className="w-8 h-8 mb-2" />
      <span className="text-sm font-medium">No tasks yet</span>
      <span className="text-xs">Add your first task above</span>
    </div>
  );

  return (
    <DashboardTile 
      title="To-Do List" 
      icon={CheckSquare} 
      colSpan={4}
      action={
        <span className="text-xs text-muted-foreground">
          {openTasks.length} open
        </span>
      }
    >
      {/* Inline Add Task */}
      <div className="flex items-center gap-2 mb-3">
        <Input
          placeholder="Add a task..."
          value={newTaskContent}
          onChange={(e) => setNewTaskContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-9 text-sm bg-muted/30 border-border/30"
          disabled={isAdding}
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 flex-shrink-0"
          onClick={handleAddTask}
          disabled={!newTaskContent.trim() || isAdding}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Task List */}
      {openTasks.length === 0 ? (
        emptyState
      ) : (
        <ScrollArea className="h-[180px]">
          <div className="space-y-1 pr-2">
            {openTasks.map((task) => (
              <button
                key={task.id}
                onClick={() => onTaskClick(task)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors duration-150 text-left group"
              >
                {/* Checkbox */}
                <button
                  onClick={(e) => handleToggleComplete(task, e)}
                  className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Circle className="w-4 h-4 group-hover:hidden" />
                  <CheckCircle2 className="w-4 h-4 hidden group-hover:block text-primary" />
                </button>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{task.content}</p>
                  {task.project && (
                    <p className="text-xs text-muted-foreground truncate">
                      {task.project.name}
                    </p>
                  )}
                </div>

                {/* Priority indicator */}
                {task.priority === 'high' && (
                  <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                )}
                {task.priority === 'medium' && (
                  <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      )}
    </DashboardTile>
  );
}
