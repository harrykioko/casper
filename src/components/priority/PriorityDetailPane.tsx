import type { PriorityItem } from "@/types/priority";
import type { Task } from "@/hooks/useTasks";
import type { InboxItem } from "@/types/inbox";
import type { CalendarEvent } from "@/types/outlook";
import { PriorityTaskDetailContent } from "./PriorityTaskDetailContent";
import { PriorityEventDetailContent } from "./PriorityEventDetailContent";
import { InboxDetailDrawer } from "@/components/dashboard/InboxDetailDrawer";

interface PriorityDetailPaneProps {
  item: PriorityItem;
  // Source data for rendering
  task?: Task | null;
  inboxItem?: InboxItem | null;
  event?: CalendarEvent | null;
  // Actions
  onClose: () => void;
  onResolve: () => void;
  onSnooze: (duration: "later_today" | "tomorrow" | "next_week") => void;
  onEditTask?: () => void;
  onCreateTaskFromInbox?: (item: InboxItem) => void;
  onArchiveInbox?: (id: string) => void;
}

export function PriorityDetailPane({
  item,
  task,
  inboxItem,
  event,
  onClose,
  onResolve,
  onSnooze,
  onEditTask,
  onCreateTaskFromInbox,
  onArchiveInbox,
}: PriorityDetailPaneProps) {
  // Route based on source type
  switch (item.sourceType) {
    case "task":
      if (!task) return null;
      return (
        <PriorityTaskDetailContent
          task={task}
          onClose={onClose}
          onComplete={onResolve}
          onSnooze={onSnooze}
          onEdit={onEditTask || (() => {})}
        />
      );

    case "inbox":
      if (!inboxItem) return null;
      return (
        <InboxDetailDrawer
          mode="embedded"
          open={true}
          onClose={onClose}
          item={inboxItem}
          onCreateTask={onCreateTaskFromInbox || (() => {})}
          onMarkComplete={() => onResolve()}
          onArchive={onArchiveInbox || (() => {})}
        />
      );

    case "calendar_event":
      if (!event) return null;
      return (
        <PriorityEventDetailContent
          event={event}
          onClose={onClose}
        />
      );

    case "portfolio_company":
    case "pipeline_company":
      // For companies, show a simple placeholder - clicking should navigate to company page
      return (
        <div className="flex flex-col h-full rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800/50 px-5 py-4">
            <p className="text-sm text-muted-foreground">Company details</p>
            <h2 className="text-sm font-semibold text-foreground">{item.companyName}</h2>
          </div>
          <div className="flex-1 flex items-center justify-center p-5">
            <p className="text-sm text-muted-foreground text-center">
              Click to view full company details
            </p>
          </div>
        </div>
      );

    default:
      return null;
  }
}
