import { CalendarIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventGroup } from "./EventGroup";
import { EventDetailsModal } from "./EventDetailsModal";
import { Nonnegotiables, Nonnegotiable } from "./Nonnegotiables";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CalendarEvent {
  id: string;
  microsoftEventId?: string;
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
  className?: string;
  events: CalendarEvent[];
  nonnegotiables: Nonnegotiable[];
  onSync?: () => Promise<void>;
  isSyncing?: boolean;
}

export function CalendarSidebar({ className, events, nonnegotiables, onSync, isSyncing }: CalendarSidebarProps) {
  const { user } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [linkedCompanyMap, setLinkedCompanyMap] = useState<Map<string, { name: string; logo: string | null }>>(new Map());

  // Fetch all calendar_event_links for displayed events (lookup by both UUID and MS ID)
  const eventIds = useMemo(() => events.map(e => e.id), [events]);
  const eventMsIds = useMemo(() => 
    events.map(e => e.microsoftEventId).filter((id): id is string => Boolean(id)), 
    [events]
  );

  useEffect(() => {
    if (!user || events.length === 0) return;
    const fetchLinks = async () => {
      // Fetch by both UUID and microsoft_event_id, including logo
      const { data } = await supabase
        .from('calendar_event_links')
        .select('calendar_event_id, microsoft_event_id, company_name, company_logo_url')
        .eq('created_by', user.id);
      
      if (data) {
        const map = new Map<string, { name: string; logo: string | null }>();
        // Build lookup map by both IDs
        data.forEach(row => {
          // Only include if the event matches our displayed events
          const matchesUUID = eventIds.includes(row.calendar_event_id);
          const matchesMsId = row.microsoft_event_id && eventMsIds.includes(row.microsoft_event_id);
          const linkedInfo = { name: row.company_name, logo: row.company_logo_url };
          if (matchesUUID || matchesMsId) {
            if (row.calendar_event_id) map.set(row.calendar_event_id, linkedInfo);
            if (row.microsoft_event_id) map.set(row.microsoft_event_id, linkedInfo);
          }
        });
        setLinkedCompanyMap(map);
      }
    };
    fetchLinks();
  }, [user, eventIds, eventMsIds]);

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
      <div className={cn(
        "border-l border-zinc-200 dark:border-white/10 h-screen sticky top-0 glassmorphic flex flex-col",
        className
      )}>
        {/* Header */}
        <div className="p-6 pb-4 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="section-title flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-zinc-600 dark:text-white/60" /> 
              Calendar
            </h2>
            <div className="flex items-center gap-1.5">
              {/* Refresh button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 hover:shadow-sm ring-1 ring-zinc-300 dark:ring-white/10 rounded-full bg-white/5 hover:scale-[1.03] transition-all"
                      onClick={onSync}
                      disabled={isSyncing}
                    >
                      <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isSyncing ? "Syncing..." : "Refresh calendar"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {/* Full calendar button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:shadow-sm ring-1 ring-zinc-300 dark:ring-white/10 rounded-full bg-white/5 hover:scale-[1.03] transition-all">
                      <CalendarIcon className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View full calendar</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
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
                  linkedCompanyMap={linkedCompanyMap}
                />
              )}

              {/* Tomorrow Events */}
              {tomorrowEvents.length > 0 && (
                <EventGroup
                  title="🔜 Tomorrow"
                  events={tomorrowEvents}
                  onEventClick={handleEventClick}
                  linkedCompanyMap={linkedCompanyMap}
                />
              )}

              {/* Later This Week Events */}
              {laterThisWeekEvents.length > 0 && (
                <EventGroup
                  title="📆 This Week"
                  events={laterThisWeekEvents}
                  showDate={true}
                  onEventClick={handleEventClick}
                  linkedCompanyMap={linkedCompanyMap}
                />
              )}

              {/* Later Events */}
              {laterEvents.length > 0 && (
                <EventGroup
                  title="🗓️ Later"
                  events={laterEvents}
                  showDate={true}
                  onEventClick={handleEventClick}
                  linkedCompanyMap={linkedCompanyMap}
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
