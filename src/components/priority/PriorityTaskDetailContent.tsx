import { format, formatDistanceToNow } from "date-fns";
import { CheckCircle, Clock, Flag, X, Pencil, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Task } from "@/hooks/useTasks";

interface PriorityTaskDetailContentProps {
  task: Task;
  onClose: () => void;
  onComplete: () => void;
  onSnooze: (duration: "later_today" | "tomorrow" | "next_week") => void;
  onEdit: () => void;
}

const priorityConfig = {
  high: { label: "High", color: "text-red-600 dark:text-red-400", bgColor: "bg-red-100 dark:bg-red-900/30" },
  medium: { label: "Medium", color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  low: { label: "Low", color: "text-slate-600 dark:text-slate-400", bgColor: "bg-slate-100 dark:bg-slate-900/30" },
};

export function PriorityTaskDetailContent({
  task,
  onClose,
  onComplete,
  onSnooze,
  onEdit,
}: PriorityTaskDetailContentProps) {
  const priority = (task.priority as keyof typeof priorityConfig) || "medium";
  const config = priorityConfig[priority] || priorityConfig.medium;

  return (
    <div className="flex flex-col h-full rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800/50 px-5 py-4 space-y-3">
        {/* Row 1: Priority badge + Status */}
        <div className="flex items-center gap-2 text-xs">
          <div className={cn("px-2.5 py-1 rounded-full font-medium", config.bgColor, config.color)}>
            <Flag className="h-3 w-3 inline mr-1" />
            {config.label} Priority
          </div>
          {task.scheduledFor && (
            <span className="text-muted-foreground">
              Due {formatDistanceToNow(new Date(task.scheduledFor), { addSuffix: true })}
            </span>
          )}
          <span className="text-muted-foreground ml-auto">
            Task
          </span>
        </div>

        {/* Row 2: Title + Actions */}
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-sm font-semibold text-foreground line-clamp-2">
            {task.content}
          </h2>
          
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button 
              size="sm" 
              variant="outline"
              onClick={onComplete}
              className="h-7 px-2.5 text-xs"
            >
              <CheckCircle className="mr-1 h-3 w-3" /> Complete
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs">
                  <Clock className="mr-1 h-3 w-3" /> Snooze
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onSnooze("later_today")}>
                  Later today
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSnooze("tomorrow")}>
                  Tomorrow
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSnooze("next_week")}>
                  Next week
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onEdit}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-muted-foreground hover:text-foreground" 
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-5 py-4 overflow-y-auto space-y-4">
        {/* Project link */}
        {task.project && (
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded flex items-center justify-center"
                style={{ backgroundColor: task.project.color || '#6366f1' }}
              >
                <FolderOpen className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Project</p>
                <p className="text-sm font-medium text-foreground">{task.project.name}</p>
              </div>
            </div>
          </div>
        )}

        {/* Task details */}
        <div className="space-y-3">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Description
            </p>
            <p className="text-sm text-foreground">
              {task.content}
            </p>
          </div>

          {task.scheduledFor && (
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Due Date
              </p>
              <p className="text-sm text-foreground">
                {format(new Date(task.scheduledFor), "EEEE, MMMM d, yyyy")}
              </p>
            </div>
          )}

          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Status
            </p>
            <p className="text-sm text-foreground capitalize">
              {task.status || "To Do"}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Created
            </p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(task.created_at), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
