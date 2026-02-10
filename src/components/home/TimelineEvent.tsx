import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface TimelineEventProps {
  title: string;
  startTime: string;
  endTime?: string;
  isPast: boolean;
  isNow: boolean;
}

export function TimelineEvent({
  title,
  startTime,
  endTime,
  isPast: past,
  isNow,
}: TimelineEventProps) {
  const start = parseISO(startTime);
  const timeStr = endTime
    ? `${format(start, "h:mm a")} – ${format(parseISO(endTime), "h:mm a")}`
    : format(start, "h:mm a");

  return (
    <div
      className={cn(
        "relative flex gap-3 pb-4",
        past && "opacity-45"
      )}
    >
      {/* Dot + line */}
      <div className="flex flex-col items-center pt-1.5">
        <div
          className={cn(
            "w-2 h-2 rounded-full flex-shrink-0",
            isNow
              ? "bg-primary ring-2 ring-primary/30"
              : past
                ? "bg-muted-foreground/40"
                : "bg-muted-foreground/60 ring-1 ring-border"
          )}
        />
        <div className="w-px flex-1 bg-border/50 mt-1" />
      </div>

      {/* Content */}
      <div className="min-w-0 pb-1">
        <p className="text-[11px] text-muted-foreground leading-none mb-1">
          {timeStr}
          {isNow && (
            <span className="ml-1.5 text-primary font-medium">(Now)</span>
          )}
        </p>
        <p className="text-sm text-foreground truncate">{title}</p>
      </div>
    </div>
  );
}
