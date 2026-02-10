import { useMemo } from "react";
import { Sparkles, Clock, Calendar } from "lucide-react";
import { format, isToday, isBefore, isAfter, parseISO } from "date-fns";
import type { CalendarEvent } from "@/types/outlook";

interface CommandAssistPanelProps {
  events: CalendarEvent[];
}

interface TimeWindow {
  start: Date;
  end: Date;
  durationMinutes: number;
}

export function CommandAssistPanel({ events }: CommandAssistPanelProps) {
  const now = new Date();

  const todayEvents = useMemo(() => {
    return events
      .filter(e => e.startTime && isToday(parseISO(e.startTime)))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [events]);

  const nextMeeting = useMemo(() => {
    return todayEvents.find(e => isAfter(parseISO(e.startTime), now));
  }, [todayEvents, now]);

  const availableWindows = useMemo<TimeWindow[]>(() => {
    const windows: TimeWindow[] = [];
    const endOfDay = new Date(now);
    endOfDay.setHours(18, 0, 0, 0);

    const futureEvents = todayEvents.filter(e => {
      const end = e.endTime ? parseISO(e.endTime) : parseISO(e.startTime);
      return isAfter(end, now);
    });

    let cursor = new Date(Math.max(now.getTime(), new Date(now).setHours(8, 0, 0, 0)));

    for (const event of futureEvents) {
      const eventStart = parseISO(event.startTime);
      if (isAfter(eventStart, cursor)) {
        const gap = Math.round((eventStart.getTime() - cursor.getTime()) / 60000);
        if (gap >= 15) {
          windows.push({ start: new Date(cursor), end: eventStart, durationMinutes: gap });
        }
      }
      const eventEnd = event.endTime ? parseISO(event.endTime) : new Date(eventStart.getTime() + 30 * 60000);
      if (isAfter(eventEnd, cursor)) {
        cursor = eventEnd;
      }
    }

    if (isBefore(cursor, endOfDay)) {
      const gap = Math.round((endOfDay.getTime() - cursor.getTime()) / 60000);
      if (gap >= 15) {
        windows.push({ start: new Date(cursor), end: endOfDay, durationMinutes: gap });
      }
    }

    return windows.slice(0, 4);
  }, [todayEvents, now]);

  return (
    <div className="sticky top-24 space-y-4">
      {/* Assist Placeholder */}
      <div className="rounded-2xl border border-dashed border-border/60 bg-card/50 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-violet-500 dark:text-violet-400" />
          <h3 className="text-sm font-semibold text-foreground">Assist</h3>
        </div>
        <p className="text-xs text-muted-foreground/60 leading-relaxed">
          AI suggestions will appear here
        </p>
      </div>

      {/* Today's Availability */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Today</h3>
        </div>

        {/* Next meeting */}
        {nextMeeting ? (
          <div className="mb-4">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              Next Meeting
            </p>
            <div className="flex items-start gap-2">
              <Calendar className="h-3.5 w-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-foreground font-medium truncate">
                  {nextMeeting.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(nextMeeting.startTime), "h:mm a")}
                  {nextMeeting.endTime && (
                    <> · {Math.round((parseISO(nextMeeting.endTime).getTime() - parseISO(nextMeeting.startTime).getTime()) / 60000)} min</>
                  )}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground/60">No more meetings today</p>
          </div>
        )}

        {/* Available windows */}
        {availableWindows.length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              Available
            </p>
            <div className="space-y-1.5">
              {availableWindows.map((w, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {format(w.start, "h:mm")} – {format(w.end, "h:mm a")}
                  </span>
                  <span className="text-muted-foreground/60">
                    {w.durationMinutes >= 60
                      ? `${Math.floor(w.durationMinutes / 60)}h ${w.durationMinutes % 60 ? `${w.durationMinutes % 60}m` : ""}`
                      : `${w.durationMinutes}m`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
