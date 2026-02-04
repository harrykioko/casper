import { InboxContentPane } from "./InboxContentPane";
import { InlineActionPanel } from "./InlineActionPanel";
import type { InboxItem } from "@/types/inbox";
import type { InboxAttachment } from "@/hooks/useInboxAttachments";

interface InboxDetailWorkspaceProps {
  item: InboxItem;
  onClose: () => void;
  onMarkComplete: (id: string) => void;
  onArchive: (id: string) => void;
  onSnooze?: (id: string, until: Date) => void;
  onSaveAttachmentToCompany?: (attachment: InboxAttachment) => void;
  onUnlinkCompany?: (id: string) => void;
  attachmentCount?: number;
  hideCloseButton?: boolean;
  // Legacy props - no longer used but kept for compatibility
  onCreateTask?: (item: InboxItem, suggestionTitle?: string) => void;
  onAddNote?: (item: InboxItem) => void;
  onLinkCompany?: (item: InboxItem) => void;
  onSaveAttachments?: (item: InboxItem) => void;
  onApproveSuggestion?: (item: InboxItem, suggestion: any) => void;
}

export function InboxDetailWorkspace({
  item,
  onClose,
  onMarkComplete,
  onArchive,
  onSnooze,
  onSaveAttachmentToCompany,
  onUnlinkCompany,
  attachmentCount = 0,
  hideCloseButton = false,
}: InboxDetailWorkspaceProps) {
  return (
    <div className="flex h-full rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Left: Content Column (scrollable) */}
      <div className="flex-1 min-w-0 overflow-y-auto bg-background">
        <InboxContentPane 
          item={item} 
          onClose={onClose}
          hideCloseButton={hideCloseButton}
          onSaveAttachmentToCompany={onSaveAttachmentToCompany}
          onUnlinkCompany={onUnlinkCompany}
        />
      </div>
      
      {/* Right: Inline Action Panel (wider, supports forms) */}
      <div className="w-[320px] xl:w-[380px] flex-shrink-0 border-l border-border overflow-hidden">
        <InlineActionPanel
          item={item}
          onMarkComplete={onMarkComplete}
          onArchive={onArchive}
          onSnooze={onSnooze}
          attachmentCount={attachmentCount}
        />
      </div>
    </div>
  );
}
