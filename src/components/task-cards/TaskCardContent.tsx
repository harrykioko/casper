
import { cn } from "@/lib/utils";

interface TaskCardContentProps {
  content: string;
  completed?: boolean;
  className?: string;
}

export function TaskCardContent({ content, completed, className }: TaskCardContentProps) {
  return (
    <p className={cn(
      "text-sm font-medium truncate",
      completed && "line-through text-muted-foreground",
      className
    )}>
      {content}
    </p>
  );
}
