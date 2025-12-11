import { Fragment } from "react";
import { motion } from "framer-motion";
import { EventCard } from "./EventCard";
import { NowIndicator } from "./NowIndicator";

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime?: string;
  location?: string;
  category?: string;
  description?: string;
  attendees?: Array<{
    name: string;
    email?: string;
    avatar?: string;
  }>;
}

interface EventGroupProps {
  title: string;
  events: CalendarEvent[];
  isToday?: boolean;
  showDate?: boolean;
  onEventClick?: (event: CalendarEvent) => void;
}

// Helper: Check if an event has already ended
const isPastEvent = (event: CalendarEvent): boolean => {
  const now = new Date();
  const eventEnd = event.endTime ? new Date(event.endTime) : new Date(event.startTime);
  return now > eventEnd;
};

// Helper: Check if we're currently in this event
const isCurrentEvent = (event: CalendarEvent): boolean => {
  const now = new Date();
  const eventStart = new Date(event.startTime);
  const eventEnd = event.endTime 
    ? new Date(event.endTime) 
    : new Date(eventStart.getTime() + 60 * 60 * 1000); // Default 1hr duration
  return now >= eventStart && now <= eventEnd;
};

// Helper: Get position where "Now" indicator should be inserted
const getNowIndicatorPosition = (events: CalendarEvent[]): number => {
  const now = new Date();
  
  for (let i = 0; i < events.length; i++) {
    const eventStart = new Date(events[i].startTime);
    
    // If now is before this event starts, insert indicator here
    if (now < eventStart) {
      return i;
    }
    
    // Check if we're currently in this event - don't show indicator
    if (isCurrentEvent(events[i])) {
      return -1;
    }
  }
  
  // All events have passed, show at bottom
  return events.length;
};

export function EventGroup({ title, events, isToday = false, showDate = false, onEventClick }: EventGroupProps) {
  // Sort events by start time
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  // Get now indicator position for today's events
  const nowPosition = isToday ? getNowIndicatorPosition(sortedEvents) : -1;

  // Group events by date if showDate is true
  const eventsByDate: Record<string, CalendarEvent[]> = {};
  if (showDate) {
    sortedEvents.forEach(event => {
      const dateKey = new Date(event.startTime).toDateString();
      if (!eventsByDate[dateKey]) {
        eventsByDate[dateKey] = [];
      }
      eventsByDate[dateKey].push(event);
    });
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <h3 className="text-sm font-medium text-zinc-700 dark:text-white/80 mb-3">
        {title}
      </h3>
      
      {showDate ? (
        // Show events grouped by date
        <div className="space-y-4">
          {Object.entries(eventsByDate).map(([dateKey, dateEvents]) => (
            <div key={dateKey} className="space-y-2">
              <p className="text-xs font-medium text-zinc-600 dark:text-white/70 pl-1">
                {formatDate(dateEvents[0].startTime)}
              </p>
              <div className="space-y-2">
                {dateEvents.map((event, index) => (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    delay={index * 0.05}
                    onClick={onEventClick}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Show events without date grouping (includes Now indicator for today)
        <div className="space-y-2">
          {sortedEvents.map((event, index) => (
            <Fragment key={event.id}>
              {/* Insert Now indicator at the correct position */}
              {isToday && nowPosition === index && <NowIndicator />}
              <EventCard 
                event={event} 
                delay={index * 0.05}
                isToday={isToday}
                isPast={isToday && isPastEvent(event)}
                isCurrent={isToday && isCurrentEvent(event)}
                onClick={onEventClick}
              />
            </Fragment>
          ))}
          {/* Now indicator at the end if all events have passed */}
          {isToday && nowPosition === sortedEvents.length && <NowIndicator />}
        </div>
      )}
    </motion.div>
  );
}
