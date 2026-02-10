import { useMemo } from "react";
import { Sparkles, Clock, Send, MessageSquare } from "lucide-react";
import { format, isToday, isBefore, isAfter, parseISO, differenceInMinutes } from "date-fns";
import type { CalendarEvent } from "@/types/outlook";

interface CommandAssistPanelProps {
  events: CalendarEvent[];
}

interface TimeWindow {
  start: Date;
  end: Date;
  durationMinutes: number;
}

const SUGGESTED_PROMPTS = [
  "Summarize what's urgent",
  "What can I do in 15 min?",
  "Draft a reply",
];

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

  const minutesUntilNext = useMemo(() => {
    if (!nextMeeting) return null;
    return differenceInMinutes(parseISO(nextMeeting.startTime), now);
  }, [nextMeeting, now]);

  const countdownLabel = useMemo(() => {
    if (minutesUntilNext == null) return null;
    const h = Math.floor(minutesUntilNext / 60);
    const m = minutesUntilNext % 60;
    if (h > 0) return `Next meeting in ${h}h ${m}m`;
    return `Next meeting in ${m}m`;
  }, [minutesUntilNext]);

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
    <div className="sticky top-24 rounded-2xl border border-border bg-card shadow-sm flex flex-col h-[calc(100vh-12rem)] overflow-hidden">
      {/* Section 1: Assist */}
      <div className="flex-1 flex flex-col min-h-0 p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4 shrink-0">
          <Sparkles className="h-4 w-4 text-violet-500 dark:text-violet-400" />
          <h3 className="text-sm font-semibold text-foreground">Assist</h3>
        </div>

        {/* Scrollable message area */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center gap-4 px-2">
          <MessageSquare className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground/60 text-center">
            What would you like to do?
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-1">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                disabled
                className="text-xs px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground hover:bg-muted transition-colors cursor-default"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Pinned input */}
        <div className="shrink-0 mt-3 flex items-center gap-2">
          <input
            disabled
            placeholder="Ask Casper what to do next..."
            className="flex-1 h-9 rounded-lg border border-input bg-background/50 px-3 text-sm text-muted-foreground placeholder:text-muted-foreground/50 opacity-60 cursor-not-allowed"
          />
          <button
            disabled
            className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground/40 cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-border/40" />

      {/* Section 2: Today's Availability */}
      <div className="shrink-0 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Today</h4>
        </div>

        {nextMeeting ? (
          <div className="space-y-2">
            {/* Countdown */}
            {countdownLabel && (
              <p className="text-sm font-medium text-foreground">{countdownLabel}</p>
            )}
            {/* Meeting detail */}
            <p className="text-xs text-muted-foreground truncate">
              {nextMeeting.title}
              <span className="mx-1.5 text-muted-foreground/40">·</span>
              {format(parseISO(nextMeeting.startTime), "h:mm")}
              {nextMeeting.endTime && <>–{format(parseISO(nextMeeting.endTime), "h:mm a")}</>}
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/60">No more meetings today</p>
        )}

        {/* Available windows */}
        {availableWindows.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {availableWindows.map((w, i) => {
              const durLabel = w.durationMinutes >= 60
                ? `${Math.floor(w.durationMinutes / 60)}h ${w.durationMinutes % 60 ? `${w.durationMinutes % 60}m` : ""}`.trim()
                : `${w.durationMinutes}m`;
              return (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {format(w.start, "h:mm")}–{format(w.end, "h:mm a")}
                  </span>
                  <span className="text-muted-foreground/50 tabular-nums">{durLabel}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
