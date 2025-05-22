
import { motion } from "framer-motion";

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime?: string;
  location?: string;
  category?: string; // Changed from "work" | "social" | "personal" to string
}

interface TodayCalendarProps {
  events: CalendarEvent[];
}

export function TodayCalendar({ events }: TodayCalendarProps) {
  // Format time to display in a readable format (e.g., "9:00 AM")
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Sort events by start time
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return (
    <div className="space-y-3">
      {sortedEvents.length === 0 ? (
        <div className="text-center py-4 text-zinc-500 dark:text-white/60 text-sm">
          No events scheduled today
        </div>
      ) : (
        sortedEvents.map((event) => {
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
              transition={{ duration: 0.2 }}
            >
              <div className={`w-1 ${categoryColor}`} />
              <div className="flex-1 p-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-sm text-zinc-800 dark:text-white/90">{event.title}</h4>
                  <span className="text-xs bg-white/10 dark:bg-black/20 px-2 py-0.5 rounded text-zinc-600 dark:text-white/70">
                    {formatTime(event.startTime)}
                    {event.endTime && ` - ${formatTime(event.endTime)}`}
                  </span>
                </div>
                {event.location && (
                  <p className="text-xs text-zinc-500 dark:text-white/60 mt-1">{event.location}</p>
                )}
              </div>
            </motion.div>
          );
        })
      )}
    </div>
  );
}
