import { cn } from "@/lib/utils";

interface TaskCardPriorityProps {
  priority?: "low" | "medium" | "high";
  className?: string;
}

// Subtle, non-aggressive priority colors
const priorityConfig = {
  high: { 
    label: "P1", 
    className: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" 
  },
  medium: { 
    label: "P2", 
    className: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" 
  },
  low: { 
    label: "P3", 
    className: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" 
  },
};

export function TaskCardPriority({ priority, className }: TaskCardPriorityProps) {
  if (!priority) return null;

  const config = priorityConfig[priority];

  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
      config.className,
      className
    )}>
      {config.label}
    </span>
  );
}
