
import { motion } from "framer-motion";
import { EventCard } from "./EventCard";

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

export function EventGroup({ title, events, isToday = false, showDate = false, onEventClick }: EventGroupProps) {
  // Sort events by start time
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

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
        // Show events without date grouping
        <div className="space-y-2">
          {sortedEvents.map((event, index) => (
            <EventCard 
              key={event.id} 
              event={event} 
              delay={index * 0.05}
              isToday={isToday}
              onClick={onEventClick}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
