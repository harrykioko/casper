import { Dialog, DialogContent, DialogOverlay, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { EventDetailsModal } from "@/components/dashboard/EventDetailsModal";
import { FocusTriageBar } from "./FocusTriageBar";

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

interface FocusEventModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  // Triage actions
  onMarkTrusted: () => void;
  onSnooze: (until: Date) => void;
  onNoAction: () => void;
  showLink?: boolean;
  onLink?: () => void;
}

/**
 * Wraps the EventDetailsModal with a FocusTriageBar.
 * Since EventDetailsModal manages its own Dialog internally,
 * we render the triage bar as an overlay at the top.
 */
export function FocusEventModal({
  event,
  isOpen,
  onClose,
  onMarkTrusted,
  onSnooze,
  onNoAction,
  showLink = false,
  onLink,
}: FocusEventModalProps) {
  if (!event) return null;

  return (
    <>
      {/* Render the existing EventDetailsModal */}
      <EventDetailsModal event={event} isOpen={isOpen} onClose={onClose} />

      {/* Overlay a triage bar at the bottom of the viewport when modal is open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] rounded-xl shadow-lg border border-border bg-background/95 backdrop-blur-xl"
          >
            <FocusTriageBar
              onMarkTrusted={() => { onMarkTrusted(); onClose(); }}
              onSnooze={(until) => { onSnooze(until); onClose(); }}
              onNoAction={() => { onNoAction(); onClose(); }}
              showLink={showLink}
              onLink={onLink}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
