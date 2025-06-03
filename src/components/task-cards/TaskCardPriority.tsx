
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
        return { 
          style: "bg-gradient-to-r from-[#FF6A79]/20 to-[#FF6A79]/10 text-[#FF6A79]", 
          label: "P1" 
        };
      case "medium":
        return { 
          style: "bg-gradient-to-r from-[#FF8A65]/20 to-[#FF8A65]/10 text-[#FF8A65]", 
          label: "P2" 
        };
      case "low":
        return { 
          style: "bg-gradient-to-r from-muted-foreground/20 to-muted-foreground/10 text-muted-foreground", 
          label: "P3" 
        };
    }
  };

  const config = getPriorityConfig(priority);

  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
      config.style,
      className
    )}>
      {config.label}
    </span>
  );
}
