import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventGroup } from "./EventGroup";
import { EventDetailsModal } from "./EventDetailsModal";
import { Nonnegotiables, Nonnegotiable } from "./Nonnegotiables";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

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

interface CalendarSidebarProps {
  events: CalendarEvent[];
  nonnegotiables: Nonnegotiable[];
}

export function CalendarSidebar({ events, nonnegotiables }: CalendarSidebarProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Get end of this week (Sunday)
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()));

  // Group events by time periods
  const todayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    return eventDay.getTime() === today.getTime();
  });

  const tomorrowEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    return eventDay.getTime() === tomorrow.getTime();
  });

  const laterThisWeekEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    return eventDay > tomorrow && eventDay <= endOfWeek;
  });

  const laterEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    return eventDay > endOfWeek;
  });

  return (
    <>
      <div className="w-80 border-l border-zinc-200 dark:border-white/10 h-screen sticky top-0 glassmorphic flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="section-title flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-zinc-600 dark:text-white/60" /> 
              Calendar
            </h2>
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
        </div>

        {/* Events Section - Upper 80% */}
        <div className="flex-[4] min-h-0 px-6">
          <ScrollArea className="h-full">
            <div className="space-y-6 pb-4">
              {/* Today Events - only show if there are events */}
              {todayEvents.length > 0 && (
                <EventGroup 
                  title="📅 Today" 
                  events={todayEvents} 
                  isToday={true}
                  onEventClick={handleEventClick}
                />
              )}
              
              {/* Tomorrow Events */}
              {tomorrowEvents.length > 0 && (
                <EventGroup 
                  title="🔜 Tomorrow" 
                  events={tomorrowEvents}
                  onEventClick={handleEventClick} 
                />
              )}
              
              {/* Later This Week Events */}
              {laterThisWeekEvents.length > 0 && (
                <EventGroup 
                  title="📆 This Week" 
                  events={laterThisWeekEvents} 
                  showDate={true}
                  onEventClick={handleEventClick}
                />
              )}
              
              {/* Later Events */}
              {laterEvents.length > 0 && (
                <EventGroup 
                  title="🗓️ Later" 
                  events={laterEvents} 
                  showDate={true}
                  onEventClick={handleEventClick}
                />
              )}

              {/* Show message if no events at all */}
              {events.length === 0 && (
                <div className="text-center py-8 text-zinc-500 dark:text-white/60 text-sm">
                  No upcoming events
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Separator */}
        <div className="px-6">
          <Separator className="bg-zinc-200 dark:bg-white/10" />
        </div>

        {/* Nonnegotiables Section - Lower 20% */}
        <div className="flex-[1] min-h-0 p-6 pt-4">
          <ScrollArea className="h-full">
            <Nonnegotiables items={nonnegotiables} />
          </ScrollArea>
        </div>
      </div>

      {/* Event Details Modal */}
      <EventDetailsModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}
