
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
      <div className={cn("flex items-center gap-2 mt-1", className)}>
        <TaskCardPriority priority={priority} />
        <TaskCardProject project={project} />
        <TaskCardDate scheduledFor={scheduledFor} />
      </div>
    );
  }

  // Kanban layout
  return (
    <div className={cn("flex items-center justify-between gap-2 mt-1", className)}>
      <div className="flex items-center gap-2">
        <TaskCardDate scheduledFor={scheduledFor} />
        <TaskCardProject project={project} />
      </div>
      <TaskCardPriority priority={priority} />
    </div>
  );
}
