
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Task } from "@/hooks/useTasks";

interface QuickTasksPanelProps {
  quickTasks: Task[];
  onTaskComplete: (id: string) => void;
  onTaskDelete: (id: string) => void;
}

export function QuickTasksPanel({ quickTasks, onTaskComplete, onTaskDelete }: QuickTasksPanelProps) {
  return (
    <div className="lg:w-[30%] lg:min-w-[320px]">
      <Card className="glassmorphic border-muted/30 sticky top-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            ⚡ Quick Tasks
          </CardTitle>
          <p className="text-sm text-muted-foreground">Quick capture for triage</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {quickTasks.length > 0 ? (
            quickTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-xl p-4 bg-muted/30 backdrop-blur border border-muted/30 hover:bg-muted/40 hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer"
              >
                <div className="font-medium text-sm leading-tight text-foreground">
                  {task.content}
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskComplete(task.id);
                    }}
                    className="h-6 px-2 text-xs"
                  >
                    Complete
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskDelete(task.id);
                    }}
                    className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-2xl mb-2">⚡</div>
              <p className="text-sm">No quick tasks yet</p>
              <p className="text-xs mt-1">Tasks added above will appear here for triage</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
