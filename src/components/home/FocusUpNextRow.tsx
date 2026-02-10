import { ChevronRight, Circle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { differenceInDays, isPast, isToday, parseISO, startOfDay } from "date-fns";

interface FocusUpNextRowProps {
  id: string;
  title: string;
  type: "task" | "commitment";
  scheduledFor?: string;
  personName?: string;
  completed?: boolean;
  onToggle: (id: string) => void;
  onClick: (id: string) => void;
}

export function FocusUpNextRow({
  id,
  title,
  type,
  scheduledFor,
  personName,
  completed,
  onToggle,
  onClick,
}: FocusUpNextRowProps) {
  const isOverdue =
    scheduledFor &&
    isPast(parseISO(scheduledFor)) &&
    !isToday(parseISO(scheduledFor));

  const overdueDays = isOverdue
    ? differenceInDays(startOfDay(new Date()), startOfDay(parseISO(scheduledFor!)))
    : 0;

  return (
    <div
      className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border/50 shadow-sm hover:shadow-md hover:shadow-black/[0.04] dark:hover:shadow-black/20 transition-all cursor-pointer"
      onClick={() => onClick(id)}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle(id);
        }}
        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
      >
        {completed ? (
          <CheckCircle2 className="h-4 w-4 text-primary" />
        ) : (
          <Circle className="h-4 w-4" />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm truncate",
            completed && "line-through text-muted-foreground"
          )}
        >
          {title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {isOverdue && (
            <span className="text-[11px] text-destructive font-medium">
              {overdueDays}d overdue
            </span>
          )}
          {type === "commitment" && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
              Commitment{personName ? ` · ${personName}` : ""}
            </span>
          )}
        </div>
      </div>

      {/* Chevron */}
      <ChevronRight className="h-4 w-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </div>
  );
}
