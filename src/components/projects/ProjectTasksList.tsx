
import { CheckCircle, Plus } from "lucide-react";
import { CardTitle, Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/components/dashboard/TaskList";

interface ProjectTasksListProps {
  tasks: Task[];
}

export function ProjectTasksList({ tasks }: ProjectTasksListProps) {
  const getBadgeColorForSchedule = (scheduledFor: string) => {
    if (scheduledFor === 'Today') return 'bg-indigo-500/10 text-indigo-500 border-indigo-200/50';
    if (scheduledFor === 'Yesterday') return 'bg-zinc-400/10 text-zinc-500 border-zinc-200/50';
    return 'bg-teal-500/10 text-teal-500 border-teal-200/50'; // Future
  };

  const getPriorityBorderColor = (priority: string) => {
    if (priority === 'high') return 'border-red-500';
    if (priority === 'medium') return 'border-yellow-500';
    return 'border-green-500'; // low
  };
  
  return (
    <Card className="lg:col-span-2 relative rounded-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-sm ring-1 ring-black/5 dark:ring-white/10 hover:shadow-md/10 transition group">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <CheckCircle className="mr-2 h-5 w-5" />
          Tasks
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Task
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No tasks yet</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map(task => (
              <li 
                key={task.id}
                className={`flex items-center gap-3 p-2 rounded-md hover:bg-accent/30 transition-colors border-l-4 pl-3 ${getPriorityBorderColor(task.priority)}`}
              >
                <span 
                  className={`flex-1 ${task.completed ? "line-through text-muted-foreground" : ""}`}
                >
                  {task.content}
                </span>
                {task.scheduledFor && (
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getBadgeColorForSchedule(task.scheduledFor)}`}
                  >
                    {task.scheduledFor}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
