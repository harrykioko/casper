import { InboxContentPane } from "./InboxContentPane";
import { InboxActionRail } from "./InboxActionRail";
import type { InboxItem } from "@/types/inbox";

interface InboxDetailWorkspaceProps {
  item: InboxItem;
  onClose: () => void;
  onCreateTask: (item: InboxItem) => void;
  onMarkComplete: (id: string) => void;
  onArchive: (id: string) => void;
  onSnooze?: (id: string, until: Date) => void;
  onAddNote?: (item: InboxItem) => void;
}

export function InboxDetailWorkspace({
  item,
  onClose,
  onCreateTask,
  onMarkComplete,
  onArchive,
  onSnooze,
  onAddNote,
}: InboxDetailWorkspaceProps) {
  return (
    <div className="flex h-full rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Left: Content Column (scrollable) */}
      <div className="flex-1 min-w-0 overflow-y-auto bg-background">
        <InboxContentPane 
          item={item} 
          onClose={onClose} 
        />
      </div>
      
      {/* Right: Action Rail (sticky within its container) */}
      <div className="w-[200px] xl:w-[220px] flex-shrink-0 border-l border-border overflow-y-auto">
        <InboxActionRail
          item={item}
          onCreateTask={onCreateTask}
          onMarkComplete={onMarkComplete}
          onArchive={onArchive}
          onSnooze={onSnooze}
          onAddNote={onAddNote}
        />
      </div>
    </div>
  );
}
