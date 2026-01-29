import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { InboxItem } from "@/types/inbox";
import type { StructuredSuggestion } from "@/types/inboxSuggestions";

export interface InboxDrawerHandlers {
  onCreateTask: (item: InboxItem, suggestionTitle?: string) => void;
  onMarkComplete: (id: string) => void;
  onArchive: (id: string) => void;
  onSnooze?: (id: string, until: Date) => void;
  onAddNote?: (item: InboxItem) => void;
  onLinkCompany?: (item: InboxItem) => void;
  onSaveAttachments?: (item: InboxItem) => void;
  onApproveSuggestion?: (item: InboxItem, suggestion: StructuredSuggestion) => void;
}

interface GlobalInboxDrawerContextValue {
  isOpen: boolean;
  item: InboxItem | null;
  handlers: InboxDrawerHandlers | null;
  openDrawer: (item: InboxItem, handlers: InboxDrawerHandlers) => void;
  closeDrawer: () => void;
}

const GlobalInboxDrawerContext = createContext<GlobalInboxDrawerContextValue | undefined>(undefined);

export function GlobalInboxDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [item, setItem] = useState<InboxItem | null>(null);
  const [handlers, setHandlers] = useState<InboxDrawerHandlers | null>(null);

  const openDrawer = useCallback((newItem: InboxItem, newHandlers: InboxDrawerHandlers) => {
    setItem(newItem);
    setHandlers(newHandlers);
    setIsOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
    // Delay clearing item to allow exit animation
    setTimeout(() => {
      setItem(null);
      setHandlers(null);
    }, 300);
  }, []);

  return (
    <GlobalInboxDrawerContext.Provider value={{ isOpen, item, handlers, openDrawer, closeDrawer }}>
      {children}
    </GlobalInboxDrawerContext.Provider>
  );
}

export function useGlobalInboxDrawer() {
  const context = useContext(GlobalInboxDrawerContext);
  if (context === undefined) {
    throw new Error("useGlobalInboxDrawer must be used within a GlobalInboxDrawerProvider");
  }
  return context;
}
