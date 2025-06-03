
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TaskCardProjectProps {
  project?: {
    id: string;
    name: string;
    color: string;
  };
  className?: string;
}

export function TaskCardProject({ project, className }: TaskCardProjectProps) {
  if (!project) return null;

  return (
    <Badge 
      variant="outline"
      className={cn(
        "text-xs px-2 py-0.5 rounded-full bg-muted/50 border-muted/30 backdrop-blur-sm",
        className
      )}
      style={{
        borderColor: `${project.color}40`,
        backgroundColor: `${project.color}10`,
        color: project.color,
      }}
    >
      {project.name}
    </Badge>
  );
}
