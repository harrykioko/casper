
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
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full bg-muted/20 text-muted-foreground px-3 py-1 text-xs font-medium",
      className
    )}>
      <div 
        className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
        style={{ backgroundColor: project.color || "#FF1464" }}
      />
      {project.name}
    </span>
  );
}
