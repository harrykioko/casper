import { Sheet, SheetContent } from "@/components/ui/sheet";
import { InboxDetailDrawer } from "@/components/dashboard/InboxDetailDrawer";
import { FocusTriageBar } from "./FocusTriageBar";
import type { InboxItem } from "@/types/inbox";

interface FocusInboxDrawerProps {
  open: boolean;
  onClose: () => void;
  item: InboxItem | null;
  onCreateTask: (item: InboxItem) => void;
  onMarkComplete: (id: string) => void;
  onArchive: (id: string) => void;
  // Triage actions
  onMarkTrusted: () => void;
  onSnooze: (until: Date) => void;
  onNoAction: () => void;
  showLink?: boolean;
  onLink?: () => void;
}

export function FocusInboxDrawer({
  open,
  onClose,
  item,
  onCreateTask,
  onMarkComplete,
  onArchive,
  onMarkTrusted,
  onSnooze,
  onNoAction,
  showLink = false,
  onLink,
}: FocusInboxDrawerProps) {
  if (!item) return null;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-full sm:w-[540px] p-0 flex flex-col bg-background">
        <FocusTriageBar
          onMarkTrusted={onMarkTrusted}
          onSnooze={onSnooze}
          onNoAction={onNoAction}
          showLink={showLink}
          onLink={onLink}
        />
        <div className="flex-1 overflow-hidden">
          <InboxDetailDrawer
            mode="embedded"
            open={true}
            onClose={onClose}
            item={item}
            onCreateTask={onCreateTask}
            onMarkComplete={onMarkComplete}
            onArchive={onArchive}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
