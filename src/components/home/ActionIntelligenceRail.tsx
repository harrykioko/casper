import { useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isToday, isAfter, isBefore, parseISO, differenceInMinutes } from "date-fns";
import type { CalendarEvent } from "@/types/outlook";
import type { TriageQueueItem, TriageCounts } from "@/hooks/useTriageQueue";
import type { InsightLine, SuggestedMove } from "@/hooks/useActionIntelligence";

interface TimeWindow {
  start: Date;
  end: Date;
  durationMinutes: number;
}

interface ActionIntelligenceRailProps {
  events: CalendarEvent[];
  isCalendarConnected: boolean;
  onConnectCalendar: () => void;
  allItems: TriageQueueItem[];
  counts: TriageCounts;
  insights: InsightLine[];
  suggestions: SuggestedMove[];
  onActivateMove: (move: SuggestedMove) => void;
  tick: number;
  now: Date;
}

/** Center-weighted gradient rule — floats between sections without boxing them */
function SectionDivider() {
  return (
    <div
      className="my-5"
      style={{
        height: 1,
        background:
          "linear-gradient(to right, transparent, hsl(var(--foreground) / 0.10), transparent)",
      }}
    />
  );
}

export function ActionIntelligenceRail({
  events,
  isCalendarConnected,
  onConnectCalendar,
  insights,
  suggestions,
  onActivateMove,
  tick,
  now,
}: ActionIntelligenceRailProps) {
  // ---------------------------------------------------------------------------
  // Time Context
  // ---------------------------------------------------------------------------
  const todayEvents = useMemo(() => {
    return events
      .filter(e => e.startTime && isToday(parseISO(e.startTime)))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, tick]);

  const nextMeeting = useMemo(() => {
    return todayEvents.find(e => isAfter(parseISO(e.startTime), now));
  }, [todayEvents, now]);

  const minutesUntilNext = useMemo(() => {
    if (!nextMeeting) return null;
    return differenceInMinutes(parseISO(nextMeeting.startTime), now);
  }, [nextMeeting, now]);

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
      const eventEnd = event.endTime
        ? parseISO(event.endTime)
        : new Date(eventStart.getTime() + 30 * 60000);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayEvents, now, tick]);

  const nextWindow = availableWindows.length > 0 ? availableWindows[0] : null;

  const windowDurationLabel = useMemo(() => {
    if (!nextWindow) return null;
    const h = Math.floor(nextWindow.durationMinutes / 60);
    const m = nextWindow.durationMinutes % 60;
    if (h > 0) return `${h}h ${m ? `${m}m` : ""}`.trim();
    return `${m}m`;
  }, [nextWindow]);

  const timelineProgress = useMemo(() => {
    const dayStart = new Date(now);
    dayStart.setHours(8, 0, 0, 0);
    const dayEnd = new Date(now);
    dayEnd.setHours(18, 0, 0, 0);
    const total = dayEnd.getTime() - dayStart.getTime();
    const elapsed = now.getTime() - dayStart.getTime();
    return Math.max(0, Math.min(1, elapsed / total));
  }, [now]);

  const statusLine = useMemo(() => {
    if (!isCalendarConnected || todayEvents.length === 0) return null;
    if (nextMeeting && minutesUntilNext != null) {
      if (minutesUntilNext <= 0) return null;
      if (nextWindow && nextWindow.start.getTime() <= now.getTime()) {
        return `Free now until ${format(nextWindow.end, "h:mm a")}`;
      }
      return `Next meeting in ${minutesUntilNext}m`;
    }
    return null;
  }, [isCalendarConnected, todayEvents, nextMeeting, minutesUntilNext, nextWindow, now]);

  const totalAvailableMinutes = useMemo(() => {
    return availableWindows.reduce((sum, w) => sum + w.durationMinutes, 0);
  }, [availableWindows]);

  const totalAvailableLabel = useMemo(() => {
    const h = Math.floor(totalAvailableMinutes / 60);
    const m = totalAvailableMinutes % 60;
    if (h > 0) return `${h}h ${m ? `${m}m` : ""}`.trim();
    return `${m}m`;
  }, [totalAvailableMinutes]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <motion.div
      className="sticky top-24 relative flex flex-col h-[calc(100vh-12rem)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      {/* Ambient legibility layer — not a card, just atmospheric clarity */}
      <div
        className="absolute inset-0 pointer-events-none backdrop-blur-[2px]"
        style={{
          background:
            "linear-gradient(to bottom, hsl(var(--background) / 0.15), hsl(var(--background) / 0.08), hsl(var(--background) / 0.15))",
        }}
      />

      {/* Header */}
      <div className="relative flex items-center justify-between mb-1 px-1 pt-1">
        <h3 className="text-sm font-medium text-foreground">Action Intelligence</h3>
        <RefreshCw className="h-3 w-3 text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors cursor-pointer" />
      </div>

      {/* Scrollable body */}
      <div className="relative flex-1 min-h-0 overflow-y-auto px-1 space-y-4">
        {/* Time Context */}
        <div>
          <h4 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-2.5">
            Next Focus Window
          </h4>

          {!isCalendarConnected ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground/60">
                Connect calendar to enable time context
              </p>
              <button
                onClick={onConnectCalendar}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Connect Calendar
              </button>
            </div>
          ) : todayEvents.length === 0 ? (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground/60">No more meetings today</p>
              {totalAvailableMinutes > 0 && (
                <p className="text-xs text-muted-foreground">
                  {totalAvailableLabel} available
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {nextWindow ? (
                <div>
                  <motion.p
                    className="text-base font-semibold text-foreground tabular-nums"
                    {...(minutesUntilNext != null && minutesUntilNext < 10 && minutesUntilNext > 0
                      ? {
                          animate: { opacity: [0.7, 1, 0.7] },
                          transition: { repeat: Infinity, duration: 3, ease: "easeInOut" },
                        }
                      : {})}
                  >
                    {format(nextWindow.start, "h:mm")}–{format(nextWindow.end, "h:mm a")}
                    <span className="text-xs font-normal text-muted-foreground ml-1.5">
                      · {windowDurationLabel}
                    </span>
                  </motion.p>
                </div>
              ) : !nextMeeting ? (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground/60">No more meetings today</p>
                  {totalAvailableMinutes > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {totalAvailableLabel} available
                    </p>
                  )}
                </div>
              ) : null}

              {statusLine && (
                <p className="text-xs text-muted-foreground/60">{statusLine}</p>
              )}

              {/* Timeline bar */}
              <div className="relative w-full mt-1" style={{ height: 6 }}>
                <div
                  className="absolute rounded-full"
                  style={{
                    top: "50%",
                    transform: "translateY(-50%)",
                    left: 0,
                    right: 0,
                    height: 1,
                    background: "hsl(var(--foreground) / 0.12)",
                  }}
                />
                <div
                  className="absolute rounded-full"
                  style={{
                    top: "50%",
                    transform: "translateY(-50%)",
                    left: 0,
                    height: 1,
                    width: `${timelineProgress * 100}%`,
                    background: "hsl(var(--foreground) / 0.25)",
                  }}
                />
                <div
                  className="absolute rounded-full"
                  style={{
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    left: `${timelineProgress * 100}%`,
                    width: 6,
                    height: 6,
                    background: "hsl(var(--primary))",
                    boxShadow: "0 0 0 3px hsl(var(--primary) / 0.10)",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <SectionDivider />

        {/* Stream Insights */}
        {insights.length > 0 && (
          <>
            <div>
              <h4 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-2.5">
                Stream Insights
              </h4>
              <div className="space-y-2">
                {insights.map(insight => {
                  const numberMatch = insight.text.match(/^(\d+)/);
                  const numberStr = numberMatch ? numberMatch[1] : null;
                  const restText = numberStr ? insight.text.slice(numberStr.length) : insight.text;

                  const numberColorClass =
                    insight.tone === "urgent"
                      ? "text-red-500/80 dark:text-red-400/70"
                      : insight.tone === "warn"
                        ? "text-amber-500/80 dark:text-amber-400/70"
                        : "text-foreground/80";

                  return (
                    <p key={insight.key} className="text-xs text-muted-foreground">
                      {numberStr && (
                        <span className={`tabular-nums font-semibold ${numberColorClass}`}>{numberStr}</span>
                      )}
                      {restText}
                    </p>
                  );
                })}
              </div>
            </div>

            <SectionDivider />
          </>
        )}

        {/* Suggested Moves */}
        <div>
          <h4 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-2.5">
            Suggested Moves
          </h4>
          {suggestions.length === 0 ? (
            <p className="text-xs text-muted-foreground/40">No suggestions right now</p>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-2.5">
                {suggestions.map(move => (
                  <motion.button
                    key={move.id}
                    onClick={() => onActivateMove(move)}
                    className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl
                      bg-white/55 dark:bg-white/[0.04]
                      border border-foreground/10 dark:border-white/[0.06]
                      hover:bg-white/75 dark:hover:bg-white/[0.06]
                      hover:border-foreground/15 dark:hover:border-white/[0.10]
                      transition-all duration-150 ease-out group"
                    style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.03)" }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <span className="text-xs text-foreground/80 group-hover:text-foreground transition-colors">
                      {move.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground/40 tabular-nums shrink-0 ml-3">
                      {move.timeEstimate}
                    </span>
                  </motion.button>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="relative shrink-0 px-1 py-2">
        <p className="text-[10px] text-muted-foreground/25 dark:text-muted-foreground/20">Updated just now</p>
      </div>
    </motion.div>
  );
}
