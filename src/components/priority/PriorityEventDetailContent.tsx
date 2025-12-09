import { format } from "date-fns";
import { Calendar, MapPin, Users, X, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CalendarEvent } from "@/types/outlook";

interface PriorityEventDetailContentProps {
  event: CalendarEvent;
  onClose: () => void;
  onDismiss?: () => void;
}

export function PriorityEventDetailContent({
  event,
  onClose,
  onDismiss,
}: PriorityEventDetailContentProps) {
  const startDate = new Date(event.startTime);
  const endDate = event.endTime ? new Date(event.endTime) : null;

  return (
    <div className="flex flex-col h-full rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800/50 px-5 py-4 space-y-3">
        {/* Row 1: Event type + Time */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-2.5 py-1 rounded-full font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
            <Calendar className="h-3 w-3 inline mr-1" />
            Calendar Event
          </div>
          <span className="text-muted-foreground">
            {format(startDate, "h:mm a")}
            {endDate && ` - ${format(endDate, "h:mm a")}`}
          </span>
          <span className="text-muted-foreground ml-auto">
            {format(startDate, "MMM d")}
          </span>
        </div>

        {/* Row 2: Title + Actions */}
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-sm font-semibold text-foreground line-clamp-2">
            {event.title}
          </h2>
          
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {onDismiss && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={onDismiss}
                className="h-7 px-2.5 text-xs"
                title="Remove from priority list (keeps in calendar)"
              >
                <CheckCircle className="mr-1 h-3 w-3" /> Dismiss
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-muted-foreground hover:text-foreground" 
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-5 py-4 overflow-y-auto space-y-4">
        {/* Time details */}
        <div className="p-3 rounded-lg bg-violet-50/50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
              <Clock className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {format(startDate, "EEEE, MMMM d, yyyy")}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(startDate, "h:mm a")}
                {endDate && ` - ${format(endDate, "h:mm a")}`}
              </p>
            </div>
          </div>
        </div>

        {/* Location */}
        {event.location && (
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Location
            </p>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {event.location}
            </div>
          </div>
        )}

        {/* Attendees */}
        {event.attendees && event.attendees.length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Attendees
            </p>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="flex -space-x-2">
                {event.attendees.slice(0, 5).map((attendee, idx) => (
                  <div
                    key={idx}
                    className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center"
                    title={typeof attendee === 'string' ? attendee : attendee.name}
                  >
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {(typeof attendee === 'string' ? attendee : attendee.name || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                ))}
                {event.attendees.length > 5 && (
                  <div className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      +{event.attendees.length - 5}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Description
            </p>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {event.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
