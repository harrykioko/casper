
import { cn } from "@/lib/utils";
import { TaskCardPriority } from "./TaskCardPriority";
import { TaskCardProject } from "./TaskCardProject";
import { TaskCardDate } from "./TaskCardDate";

interface TaskCardMetadataProps {
  priority?: "low" | "medium" | "high";
  project?: {
    id: string;
    name: string;
    color: string;
  };
  scheduledFor?: string;
  layout?: "list" | "kanban";
  className?: string;
}

export function TaskCardMetadata({ 
  priority, 
  project, 
  scheduledFor, 
  layout = "list",
  className 
}: TaskCardMetadataProps) {
  const hasMetadata = priority || project || scheduledFor;
  
  if (!hasMetadata) return null;

  if (layout === "list") {
    return (
      <div className={cn("flex items-center gap-2 flex-wrap", className)}>
        <TaskCardPriority priority={priority} />
        {priority && (project || scheduledFor) && (
          <span className="text-muted-foreground">•</span>
        )}
        <TaskCardProject project={project} />
        {project && scheduledFor && (
          <span className="text-muted-foreground">•</span>
        )}
        <TaskCardDate scheduledFor={scheduledFor} />
      </div>
    );
  }

  // Kanban layout
  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <div className="flex items-center gap-2">
        <TaskCardDate scheduledFor={scheduledFor} />
        {scheduledFor && project && (
          <span className="text-muted-foreground">•</span>
        )}
        <TaskCardProject project={project} />
      </div>
      <TaskCardPriority priority={priority} />
    </div>
  );
}
