
import { motion } from "framer-motion";

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime?: string;
  location?: string;
  category?: "work" | "social" | "personal";
}

interface UpcomingEventsProps {
  events: CalendarEvent[];
}

export function UpcomingEvents({ events }: UpcomingEventsProps) {
  // Format time to display in a readable format (e.g., "9:00 AM")
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date to display the day of week and date
  const formatDate = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  };

  // Sort events by start time
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  // Group events by date
  const eventsByDate: Record<string, CalendarEvent[]> = {};
  sortedEvents.forEach(event => {
    const dateKey = new Date(event.startTime).toDateString();
    if (!eventsByDate[dateKey]) {
      eventsByDate[dateKey] = [];
    }
    eventsByDate[dateKey].push(event);
  });

  return (
    <div className="space-y-6">
      {Object.keys(eventsByDate).length === 0 ? (
        <div className="text-center py-4 text-zinc-500 dark:text-white/60 text-sm">
          No upcoming events
        </div>
      ) : (
        Object.entries(eventsByDate).map(([dateKey, dateEvents], dateIndex) => (
          <div key={dateKey}>
            <h3 className="text-sm font-medium mb-3 text-zinc-700 dark:text-white/80">
              {formatDate(dateEvents[0].startTime)}
            </h3>
            <div className="space-y-3">
              {dateEvents.map((event, eventIndex) => {
                // Determine color based on category
                let categoryColor = "";
                switch(event.category) {
                  case "work":
                    categoryColor = "bg-[#415AFF]"; // Steel blue
                    break;
                  case "social":
                    categoryColor = "bg-[#FF6A79]"; // Coral
                    break;
                  case "personal":
                    categoryColor = "bg-zinc-500"; // Slate gray
                    break;
                  default:
                    categoryColor = "bg-zinc-400"; // Default
                }

                return (
                  <motion.div 
                    key={event.id} 
                    className="flex glassmorphic rounded-lg overflow-hidden"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.05 * eventIndex }}
                  >
                    <div className={`w-1 ${categoryColor}`} />
                    <div className="flex-1 p-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm text-zinc-800 dark:text-white/90">{event.title}</h4>
                        <span className="text-xs bg-white/10 dark:bg-black/20 px-2 py-0.5 rounded text-zinc-600 dark:text-white/70">
                          {formatTime(event.startTime)}
                        </span>
                      </div>
                      {event.location && (
                        <p className="text-xs text-zinc-500 dark:text-white/60 mt-1">{event.location}</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
