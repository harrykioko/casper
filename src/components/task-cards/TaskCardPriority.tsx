
import { cn } from "@/lib/utils";

interface TaskCardPriorityProps {
  priority?: "low" | "medium" | "high";
  className?: string;
}

export function TaskCardPriority({ priority, className }: TaskCardPriorityProps) {
  if (!priority) return null;

  const getPriorityConfig = (priority: "low" | "medium" | "high") => {
    switch (priority) {
      case "high":
        return { color: "bg-red-500", label: "P1" };
      case "medium":
        return { color: "bg-orange-500", label: "P2" };
      case "low":
        return { color: "bg-gray-400", label: "P3" };
    }
  };

  const config = getPriorityConfig(priority);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className={cn("w-2 h-2 rounded-full", config.color)} />
      <span className="text-xs text-muted-foreground">{config.label}</span>
    </div>
  );
}
