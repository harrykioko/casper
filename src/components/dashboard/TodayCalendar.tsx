
import { motion } from "framer-motion";
import { Calendar, MapPin } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime?: string;
  location?: string;
  category?: string;
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
      <div className="border-l-2 border-[#FF6A79] pl-2 mb-4 -ml-1">
        <span className="text-xs font-medium text-[#FF6A79]">TODAY</span>
      </div>
      {sortedEvents.length === 0 ? (
        <div className="text-center py-4 text-zinc-500 dark:text-white/60 text-sm">
          No events scheduled today — you're all clear!
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
              className="flex glassmorphic rounded-lg overflow-hidden shadow-md"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className={`w-1 ${categoryColor}`} />
              <div className="flex-1 p-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-white/80" />
                    <h4 className="font-medium text-sm text-zinc-800 dark:text-white/90">{event.title}</h4>
                  </div>
                  <span className="text-xs bg-white/10 dark:bg-black/20 px-2 py-0.5 rounded text-white/80">
                    {formatTime(event.startTime)}
                    {event.endTime && ` - ${formatTime(event.endTime)}`}
                  </span>
                </div>
                {event.location && (
                  <p className="text-sm text-white/80 leading-tight mt-1 flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {event.location}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })
      )}
    </div>
  );
}
