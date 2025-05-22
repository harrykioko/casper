
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TodayCalendar } from "./TodayCalendar";
import { UpcomingEvents } from "./UpcomingEvents";

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime?: string;
  location?: string;
  category?: string;
}

interface CalendarSidebarProps {
  events: CalendarEvent[];
}

export function CalendarSidebar({ events }: CalendarSidebarProps) {
  // Filter today's events
  const todayEvents = events.filter(event => {
    const today = new Date("2025-05-22");
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === today.toDateString();
  });

  // Filter upcoming events
  const upcomingEvents = events.filter(event => {
    const today = new Date("2025-05-22");
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() !== today.toDateString();
  });

  return (
    <div className="w-80 border-l border-white/10 p-6 overflow-y-auto h-screen sticky top-0 glassmorphic">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="section-title flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-zinc-400 dark:text-white/60" /> 
            Today
          </h2>
        </div>
        <TodayCalendar events={todayEvents} />
      </div>
      
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="section-title">Upcoming</h2>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <UpcomingEvents events={upcomingEvents} />
      </div>
    </div>
  );
}
