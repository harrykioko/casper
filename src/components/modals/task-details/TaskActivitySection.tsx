import { formatDistanceToNow } from "date-fns";
import { Clock, CalendarPlus } from "lucide-react";
import { Task } from "@/hooks/useTasks";

interface TaskActivitySectionProps {
  task: Task;
}

export function TaskActivitySection({ task }: TaskActivitySectionProps) {
  const createdAt = task.created_at ? new Date(task.created_at) : null;
  const updatedAt = task.updated_at ? new Date(task.updated_at) : null;
  const completedAt = task.completed_at ? new Date(task.completed_at) : null;

  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        Activity
      </h4>
      <div className="space-y-1.5">
        {completedAt && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3 flex-shrink-0" />
            <span>
              Completed {formatDistanceToNow(completedAt, { addSuffix: true })}
            </span>
          </div>
        )}
        {updatedAt && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3 flex-shrink-0" />
            <span>
              Updated {formatDistanceToNow(updatedAt, { addSuffix: true })}
            </span>
          </div>
        )}
        {createdAt && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarPlus className="h-3 w-3 flex-shrink-0" />
            <span>
              Created {formatDistanceToNow(createdAt, { addSuffix: true })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
