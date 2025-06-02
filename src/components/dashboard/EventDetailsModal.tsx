
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, MapPin, Video, Users, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect } from "react";

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

interface EventDetailsModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EventDetailsModal({ event, isOpen, onClose }: EventDetailsModalProps) {
  // Disable body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!event) return null;

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
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

  // Check if event has video link
  const hasVideoLink = event.location && (
    event.location.includes('zoom.us') || 
    event.location.includes('meet.google.com') ||
    event.location.includes('teams.microsoft.com')
  );

  const isLocationUrl = event.location && (
    event.location.startsWith('http://') || 
    event.location.startsWith('https://')
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayedAttendees = event.attendees?.slice(0, 3) || [];
  const remainingCount = (event.attendees?.length || 0) - 3;

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogOverlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" />
          <DialogContent 
            className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-full max-w-[90vw] sm:max-w-md md:max-w-lg lg:max-w-xl max-h-[90vh] p-0 border-none bg-transparent shadow-none"
            aria-labelledby="event-title"
            aria-describedby="event-description"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border border-gray-200/50 dark:border-gray-800/50 shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 pb-4 border-b border-gray-200/50 dark:border-gray-800/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 
                      id="event-title"
                      className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate mb-2"
                    >
                      {event.title}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {formatDate(event.startTime)}
                    </p>
                    
                    {/* Time Badge */}
                    <Badge 
                      variant="secondary" 
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border-primary/20"
                    >
                      <Clock className="h-3 w-3" />
                      {getTimeRange()}
                    </Badge>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Close modal"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 pt-4 max-h-[60vh] overflow-y-auto space-y-4">
                {/* Location */}
                {event.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      {isLocationUrl ? (
                        <a 
                          href={event.location}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 transition-colors text-sm break-all"
                        >
                          {hasVideoLink ? 'Join Video Call' : 'View Location'}
                        </a>
                      ) : (
                        <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                          {event.location}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Video Call CTA */}
                {hasVideoLink && (
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white border-0"
                  >
                    <a 
                      href={event.location}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2"
                    >
                      <Video className="h-4 w-4" />
                      Join Video Call
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                )}

                {/* Description */}
                {event.description && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</span>
                    </div>
                    <div 
                      id="event-description"
                      className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed pl-6 whitespace-pre-wrap"
                    >
                      {event.description}
                    </div>
                  </div>
                )}

                {/* Attendees */}
                {event.attendees && event.attendees.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Attendees ({event.attendees.length})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pl-6 flex-wrap">
                      {displayedAttendees.map((attendee, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={attendee.avatar} alt={attendee.name} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getInitials(attendee.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-20">
                            {attendee.name}
                          </span>
                        </div>
                      ))}
                      {remainingCount > 0 && (
                        <Badge variant="secondary" className="text-xs px-2 py-0.5">
                          +{remainingCount} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
