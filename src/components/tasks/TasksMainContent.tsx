
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskList } from "@/components/dashboard/TaskList";
import { Task } from "@/hooks/useTasks";

interface TasksMainContentProps {
  regularTasks: Task[];
  onTaskComplete: (id: string) => void;
  onTaskDelete: (id: string) => void;
  onUpdateTaskStatus: (id: string, status: "todo" | "inprogress" | "done") => void;
  onUpdateTask: (task: Task) => void;
  onTaskClick: (task: Task) => void;
}

export function TasksMainContent({ 
  regularTasks, 
  onTaskComplete, 
  onTaskDelete, 
  onUpdateTaskStatus, 
  onUpdateTask,
  onTaskClick
}: TasksMainContentProps) {
  return (
    <div className="w-full">
      <Card className="glassmorphic border-muted/30">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {regularTasks.length > 0 ? (
            <TaskList
              tasks={regularTasks}
              onTaskComplete={onTaskComplete}
              onTaskDelete={onTaskDelete}
              onTaskClick={onTaskClick}
            />
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-16 h-16 rounded-xl bg-muted/30 flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-1">
                      <div className="w-2 h-2 rounded-sm bg-primary/60"></div>
                      <div className="w-2 h-2 rounded-sm bg-muted-foreground/40"></div>
                      <div className="w-2 h-2 rounded-sm bg-muted-foreground/40"></div>
                      <div className="w-2 h-2 rounded-sm bg-muted-foreground/40"></div>
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-medium mb-2 text-foreground">No tasks yet</h3>
              <p className="text-sm">Add tasks to get started. ✨</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
