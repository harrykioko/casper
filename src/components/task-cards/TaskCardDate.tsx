
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTaskDate, getDateVariant } from "@/utils/dateUtils";

interface TaskCardDateProps {
  scheduledFor?: string;
  className?: string;
}

export function TaskCardDate({ scheduledFor, className }: TaskCardDateProps) {
  if (!scheduledFor) return null;

  const formattedDate = formatTaskDate(scheduledFor);
  const variant = getDateVariant(scheduledFor);

  if (!formattedDate) return null;

  return (
    <div className={cn(
      "flex items-center gap-1 text-xs",
      variant === "overdue" && "text-destructive",
      variant === "today" && "text-primary",
      variant === "default" && "text-muted-foreground",
      className
    )}>
      <Calendar className="h-3 w-3" />
      <span>{formattedDate}</span>
    </div>
  );
}
