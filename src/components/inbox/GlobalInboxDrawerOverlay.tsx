import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGlobalInboxDrawer } from "@/contexts/GlobalInboxDrawerContext";
import { InboxDetailWorkspace } from "./InboxDetailWorkspace";

const STORAGE_KEY = "casper:inbox-drawer:width";
const DEFAULT_WIDTH = 720;
const MIN_WIDTH = 600;
const MAX_WIDTH = 1200;

export function GlobalInboxDrawerOverlay() {
  const { isOpen, item, handlers, closeDrawer } = useGlobalInboxDrawer();
  const [width, setWidth] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_WIDTH;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
        return parsed;
      }
    }
    return DEFAULT_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Persist width to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(width));
  }, [width]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeDrawer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeDrawer]);

  // Handle resize drag
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = startX - moveEvent.clientX;
      const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth + deltaX));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, [width]);

  // Don't render if not mounted or no item
  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && item && handlers && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9997] bg-black/20 dark:bg-black/40"
            onClick={closeDrawer}
          />

          {/* Drawer */}
          <motion.div
            ref={containerRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-[9998] flex"
            style={{ width }}
          >
            {/* Resize Handle */}
            <div
              className={`absolute left-0 inset-y-0 w-1.5 cursor-ew-resize group z-10 ${
                isResizing ? "bg-primary" : "hover:bg-primary/50"
              }`}
              onMouseDown={handleResizeStart}
            >
              <div className="absolute inset-y-0 -left-1 -right-1" />
              <div
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 rounded-full transition-colors ${
                  isResizing ? "bg-primary" : "bg-muted-foreground/30 group-hover:bg-primary/70"
                }`}
              />
            </div>

            {/* Main Content */}
            <div className="flex-1 h-full bg-background border-l border-border shadow-2xl overflow-hidden">
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={closeDrawer}
                className="absolute top-4 right-4 z-20 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Workspace */}
              <InboxDetailWorkspace
                item={item}
                onClose={closeDrawer}
                onCreateTask={handlers.onCreateTask}
                onMarkComplete={handlers.onMarkComplete}
                onArchive={handlers.onArchive}
                onSnooze={handlers.onSnooze}
                onAddNote={handlers.onAddNote}
                onLinkCompany={handlers.onLinkCompany}
                onSaveAttachments={handlers.onSaveAttachments}
                onApproveSuggestion={handlers.onApproveSuggestion}
                hideCloseButton={true}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
