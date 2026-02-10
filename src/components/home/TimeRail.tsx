import { motion } from "framer-motion";
import { TimelineEvent } from "./TimelineEvent";
import { Nonnegotiables, type Nonnegotiable } from "@/components/dashboard/Nonnegotiables";
import { CalendarEvent } from "@/types/outlook";
import { isToday, parseISO, isBefore, isAfter, isWithinInterval } from "date-fns";

interface TimeRailProps {
  events: CalendarEvent[];
  nonnegotiables: Nonnegotiable[];
}

export function TimeRail({ events, nonnegotiables }: TimeRailProps) {
  const now = new Date();

  // Filter to today's events and sort by start time
  const todayEvents = events
    .filter((e) => isToday(parseISO(e.startTime)))
    .sort(
      (a, b) =>
        parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime()
    );

  // Determine which events are past/current
  const enrichedEvents = todayEvents.map((e) => {
    const start = parseISO(e.startTime);
    const end = e.endTime ? parseISO(e.endTime) : start;
    const isPast = isBefore(end, now);
    const isNow = isWithinInterval(now, { start, end });
    return { ...e, isPast, isNow };
  });

  // Show: past events (last 2 max) + now + next 3
  const nowIndex = enrichedEvents.findIndex((e) => e.isNow);
  const firstFutureIndex = enrichedEvents.findIndex((e) => !e.isPast && !e.isNow);

  let visibleEvents = enrichedEvents;
  if (enrichedEvents.length > 6) {
    // Trim to keep context around "now"
    const startIdx = Math.max(0, (nowIndex >= 0 ? nowIndex : firstFutureIndex >= 0 ? firstFutureIndex : 0) - 2);
    visibleEvents = enrichedEvents.slice(startIdx, startIdx + 6);
  }

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      {/* Today's Flow */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-4">
          Today's Flow
        </h3>
        {visibleEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground/60">No events today</p>
        ) : (
          <div>
            {visibleEvents.map((e) => (
              <TimelineEvent
                key={e.id}
                title={e.title}
                startTime={e.startTime}
                endTime={e.endTime}
                isPast={e.isPast}
                isNow={e.isNow}
              />
            ))}
          </div>
        )}
      </div>

      {/* Non-negotiables */}
      <Nonnegotiables items={nonnegotiables} />
    </motion.div>
  );
}
