import { motion } from "framer-motion";
import { MapPin, Video } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface EventCardProps {
  event: CalendarEvent;
  delay?: number;
  isToday?: boolean;
  isPast?: boolean;
  isCurrent?: boolean;
  onClick?: (event: CalendarEvent) => void;
}

export function EventCard({ event, delay = 0, isToday = false, isPast = false, isCurrent = false, onClick }: EventCardProps) {
  // Format time to display in a readable format
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getTimeRange = () => {
    const startTime = formatTime(event.startTime);
    if (event.endTime) {
      const endTime = formatTime(event.endTime);
      return `${startTime} – ${endTime}`;
    }
    return startTime;
  };

  // Determine color based on category
  const getCategoryColor = () => {
    switch(event.category) {
      case "work":
        return "border-l-blue-500";
      case "social":
        return "border-l-coral";
      case "personal":
        return "border-l-zinc-500";
      default:
        return "border-l-zinc-400";
    }
  };

  // Check if event has video link (simplified check for common video platforms)
  const hasVideoLink = event.location && (
    event.location.includes('zoom.us') || 
    event.location.includes('meet.google.com') ||
    event.location.includes('teams.microsoft.com')
  );

  const isLocationUrl = event.location && (
    event.location.startsWith('http://') || 
    event.location.startsWith('https://')
  );

  const handleClick = () => {
    if (onClick) {
      onClick(event);
    }
  };

  return (
    <motion.div 
      className={cn(
        "rounded-2xl shadow-sm bg-muted/50 backdrop-blur border-l-4",
        getCategoryColor(),
        "hover:shadow-md hover:bg-muted/70 transition-all duration-200 cursor-pointer",
        "hover:scale-[1.02] active:scale-[0.98]",
        // Current event styling - glowing border
        isCurrent && [
          "ring-2 ring-coral/40 shadow-lg",
          "shadow-coral/20 dark:shadow-coral/30",
          "bg-muted/70"
        ]
      )}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: isPast ? 0.55 : 1, y: 0 }}
      transition={{ duration: 0.2, delay }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`View details for ${event.title}`}
    >
      <div className="p-3">
        {/* Time */}
        <p className="text-xs text-muted-foreground mb-1 font-medium">
          {getTimeRange()}
        </p>
        
        {/* Title */}
        <h4 className="font-semibold text-sm leading-tight mb-2 truncate">
          {event.title}
        </h4>
        
        {/* Location or Video Link */}
        {event.location && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {hasVideoLink ? (
              <>
                <Video className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">Video call</span>
              </>
            ) : (
              <>
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {isLocationUrl ? 'Online' : event.location}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
