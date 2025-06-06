
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, MapPin, Video, Users, Calendar, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogOverlay, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect } from "react";
import DOMPurify from 'dompurify';

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

  const displayedAttendees = event.attendees?.slice(0, 5) || [];
  const remainingCount = (event.attendees?.length || 0) - 5;

  // Sanitize description HTML for safe rendering
  const sanitizeDescription = (description: string) => {
    return DOMPurify.sanitize(description, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'a', 'span', 'div'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
      ALLOW_DATA_ATTR: false
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogOverlay className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" />
          <DialogContent 
            className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-full max-w-[90vw] sm:max-w-lg max-h-[85vh] p-0 border-none bg-transparent shadow-none [&>button]:hidden"
            aria-labelledby="event-title"
            aria-describedby="event-description"
          >
            <DialogTitle className="sr-only">{event.title}</DialogTitle>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="relative rounded-2xl bg-muted/30 backdrop-blur-xl border border-muted/40 shadow-lg overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h1 
                    id="event-title"
                    className="text-xl font-bold text-foreground leading-tight flex-1"
                  >
                    {event.title}
                  </h1>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-8 w-8 rounded-full hover:bg-muted/50 transition-colors flex-shrink-0"
                    aria-label="Close modal"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Date */}
                <div className="flex items-center gap-2 text-muted-foreground mb-3">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">{formatDate(event.startTime)}</span>
                </div>

                {/* Time Badge */}
                <Badge 
                  variant="secondary" 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 text-foreground border-0"
                >
                  <Clock className="h-3 w-3" />
                  {getTimeRange()}
                </Badge>
              </div>

              {/* Content */}
              <div className="px-6 pb-6 max-h-[50vh] overflow-y-auto space-y-5">
                {/* Join Call CTA */}
                {hasVideoLink && (
                  <Button
                    asChild
                    className="w-full bg-primary/80 hover:bg-primary text-primary-foreground border-0 rounded-xl h-11"
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

                {/* Location */}
                {event.location && !hasVideoLink && (
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground">Location</p>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        {isLocationUrl ? (
                          <a 
                            href={event.location}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 transition-colors text-sm break-all"
                          >
                            View Location
                          </a>
                        ) : (
                          <p className="text-sm text-foreground break-words">
                            {event.location}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Attendees */}
                {event.attendees && event.attendees.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground">
                      Attendees ({event.attendees.length})
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      {displayedAttendees.map((attendee, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={attendee.avatar} alt={attendee.name} />
                            <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                              {getInitials(attendee.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-foreground truncate max-w-24">
                            {attendee.name}
                          </span>
                        </div>
                      ))}
                      {remainingCount > 0 && (
                        <Badge variant="secondary" className="text-xs px-2 py-1 bg-muted/50 text-muted-foreground">
                          +{remainingCount} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Description */}
                {event.description && (
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground">Description</p>
                    <div 
                      id="event-description"
                      className="prose prose-sm max-h-60 overflow-y-auto text-muted-foreground rounded-md border border-muted/30 p-3 bg-background/50"
                      dangerouslySetInnerHTML={{ 
                        __html: sanitizeDescription(event.description) 
                      }}
                    />
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
