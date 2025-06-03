
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
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full bg-muted/20 text-muted-foreground px-3 py-1 text-xs font-medium",
      className
    )}>
      <Calendar className="h-3 w-3" />
      <span>{formattedDate}</span>
    </span>
  );
}
