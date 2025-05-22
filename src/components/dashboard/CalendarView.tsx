
import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime?: string;
  location?: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  date: Date;
}

export function CalendarView({ events, date }: CalendarViewProps) {
  // Format time to display in a readable format (e.g., "9:00 AM")
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper function to determine if two events overlap
  const eventsOverlap = (event1: CalendarEvent, event2: CalendarEvent) => {
    const start1 = new Date(event1.startTime).getTime();
    const end1 = event1.endTime ? new Date(event1.endTime).getTime() : start1 + 3600000; // Default 1 hour
    const start2 = new Date(event2.startTime).getTime();
    const end2 = event2.endTime ? new Date(event2.endTime).getTime() : start2 + 3600000;
    
    return start1 < end2 && start2 < end1;
  };

  // Sort events by start time
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return (
    <Card className="h-full glassmorphic">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center text-zinc-800 dark:text-white/90">
          <Calendar className="mr-2 h-5 w-5" />
          {date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {sortedEvents.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-white/60 py-6 text-center">No events scheduled today</p>
        ) : (
          sortedEvents.map((event) => (
            <div 
              key={event.id} 
              className="p-2 rounded-md hover:bg-white/10 transition-colors cursor-default"
            >
              <div className="flex justify-between items-start">
                <p className="font-medium text-zinc-800 dark:text-white/90">{event.title}</p>
                <span className="text-xs bg-white/10 dark:bg-black/20 px-2 py-1 rounded text-zinc-600 dark:text-white/70">
                  {formatTime(event.startTime)}
                  {event.endTime && ` - ${formatTime(event.endTime)}`}
                </span>
              </div>
              {event.location && (
                <p className="text-xs text-zinc-500 dark:text-white/60 mt-1">{event.location}</p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
