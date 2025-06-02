
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TodayCalendar } from "./TodayCalendar";
import { UpcomingEvents } from "./UpcomingEvents";
import { Nonnegotiables, Nonnegotiable } from "./Nonnegotiables";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  nonnegotiables: Nonnegotiable[];
}

export function CalendarSidebar({ events, nonnegotiables }: CalendarSidebarProps) {
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
    <div className="w-80 border-l border-zinc-200 dark:border-white/10 p-6 overflow-y-auto h-screen sticky top-0 glassmorphic">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="section-title flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-zinc-600 dark:text-white/60" /> 
            Today
          </h2>
        </div>
        <TodayCalendar events={todayEvents} />
      </div>
      
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="section-title">Upcoming</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 hover:shadow-sm ring-1 ring-zinc-300 dark:ring-white/10 rounded-full bg-white/5">
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View full calendar</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <UpcomingEvents events={upcomingEvents} />
      </div>
      
      {/* Nonnegotiables Section */}
      <div className="mt-8">
        <Nonnegotiables items={nonnegotiables} />
      </div>
    </div>
  );
}
