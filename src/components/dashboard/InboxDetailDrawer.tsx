import { useState, useMemo } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ListTodo, Check, Archive, X, ChevronDown } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { InboxDetailWorkspace } from "@/components/inbox/InboxDetailWorkspace";
import { InboxItem } from "@/types/inbox";
import type { StructuredSuggestion } from "@/types/inboxSuggestions";

interface InboxDetailContentProps {
  item: InboxItem;
  onClose: () => void;
  onCreateTask: (item: InboxItem) => void;
  onMarkComplete: (id: string) => void;
  onArchive: (id: string) => void;
  showCloseButton?: boolean;
}

// Patterns that indicate disclaimers or forwarded content
const DISCLAIMER_PATTERNS = [
  "DISCLAIMER:",
  "CONFIDENTIALITY NOTICE",
  "This email and any attachments",
  "---------- Forwarded message ----------",
  "--- Original Message ---",
  "From:",
  "Sent:",
  "________________________________",
];

function splitContentAtDisclaimer(content: string): { main: string; disclaimer: string | null } {
  // Find the earliest disclaimer pattern
  let splitIndex = -1;
  
  for (const pattern of DISCLAIMER_PATTERNS) {
    const index = content.indexOf(pattern);
    if (index !== -1 && (splitIndex === -1 || index < splitIndex)) {
      // Only split if it's not at the very beginning
      if (index > 100) {
        splitIndex = index;
      }
    }
  }
  
  if (splitIndex === -1) {
    return { main: content, disclaimer: null };
  }
  
  return {
    main: content.substring(0, splitIndex).trim(),
    disclaimer: content.substring(splitIndex).trim(),
  };
}

function InboxDetailContent({
  item,
  onClose,
  onCreateTask,
  onMarkComplete,
  onArchive,
  showCloseButton = true,
}: InboxDetailContentProps) {
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  
  const bodyContent = item.body || item.preview || "";
  const hasHtmlBody = !!item.htmlBody;
  
  // Split content to detect disclaimers (only for plain text)
  const { main: mainContent, disclaimer } = useMemo(() => {
    if (hasHtmlBody) {
      return { main: bodyContent, disclaimer: null };
    }
    return splitContentAtDisclaimer(bodyContent);
  }, [bodyContent, hasHtmlBody]);

  const relativeTime = formatDistanceToNow(new Date(item.receivedAt), { addSuffix: true });
  const initial = item.senderName.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col h-full">
      {/* Command Bar Header - Two Row Layout */}
      <div className="border-b border-border bg-muted/50 px-5 py-4 rounded-t-2xl space-y-3">
        {/* Row 1: Sender info (full width, no truncation) */}
        <div className="flex items-center gap-2 text-xs">
          <div className="w-7 h-7 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
              {initial}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 min-w-0">
            <span className="font-medium text-foreground">
              {item.senderName}
            </span>
            <span className="text-muted-foreground truncate">
              {item.senderEmail}
            </span>
          </div>
          <span className="text-muted-foreground flex-shrink-0 ml-auto">
            {relativeTime}
          </span>
        </div>
        
        {/* Row 2: Subject + Actions */}
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-sm font-semibold text-foreground line-clamp-2 text-left">
            {item.subject}
          </h2>
          
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onCreateTask(item)} 
              className="h-7 px-2.5 text-xs"
            >
              <ListTodo className="mr-1 h-3 w-3" /> Task
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => { onMarkComplete(item.id); onClose(); }}
              className="h-7 px-2.5 text-xs"
            >
              <Check className="mr-1 h-3 w-3" /> Complete
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => { onArchive(item.id); onClose(); }}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            >
              <Archive className="h-3.5 w-3.5" />
            </Button>
            {showCloseButton && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 px-5 py-4 overflow-y-auto">
        {/* Related company info card (if present) - at top */}
        {item.relatedCompanyName && (
          <div className="mb-4 p-3 rounded-lg bg-sky-50/50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-background border border-border flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                  {item.relatedCompanyName.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Related Company</p>
                <p className="text-sm font-medium text-foreground">{item.relatedCompanyName}</p>
              </div>
            </div>
          </div>
        )}

        {/* Email body with max-w-prose */}
        <div className="max-w-prose text-[13px] leading-relaxed text-foreground">
          {hasHtmlBody ? (
            <div 
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: item.htmlBody || "" }}
            />
          ) : (
            <>
              <p className="whitespace-pre-wrap">
                {mainContent}
              </p>
              
              {/* Collapsible disclaimer section */}
              {disclaimer && (
                <Collapsible 
                  open={isDisclaimerOpen} 
                  onOpenChange={setIsDisclaimerOpen}
                  className="mt-6"
                >
                  <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isDisclaimerOpen ? 'rotate-180' : ''}`} />
                    View full disclaimer & thread
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <div className="border-l-2 border-muted pl-4 py-2">
                      <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                        {disclaimer}
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface InboxDetailDrawerProps {
  mode?: 'sheet' | 'embedded';
  open: boolean;
  onClose: () => void;
  item: InboxItem | null;
  onCreateTask: (item: InboxItem, suggestionTitle?: string) => void;
  onMarkComplete: (id: string) => void;
  onArchive: (id: string) => void;
  onSnooze?: (id: string, until: Date) => void;
  onAddNote?: (item: InboxItem) => void;
  onLinkCompany?: (item: InboxItem) => void;
  onSaveAttachments?: (item: InboxItem) => void;
  onApproveSuggestion?: (item: InboxItem, suggestion: StructuredSuggestion) => void;
  attachmentCount?: number;
}

export function InboxDetailDrawer({
  mode = 'sheet',
  open,
  onClose,
  item,
  onCreateTask,
  onMarkComplete,
  onArchive,
  onSnooze,
  onAddNote,
  onLinkCompany,
  onSaveAttachments,
  onApproveSuggestion,
  attachmentCount = 0,
}: InboxDetailDrawerProps) {
  if (!item) return null;

  // Embedded mode - render the new two-column workspace
  if (mode === 'embedded') {
    return (
      <InboxDetailWorkspace
        item={item}
        onClose={onClose}
        onCreateTask={onCreateTask}
        onMarkComplete={onMarkComplete}
        onArchive={onArchive}
        onSnooze={onSnooze}
        onAddNote={onAddNote}
        onLinkCompany={onLinkCompany}
        onSaveAttachments={onSaveAttachments}
        onApproveSuggestion={onApproveSuggestion}
        attachmentCount={attachmentCount}
      />
    );
  }

  // Sheet mode - render with overlay (existing behavior for mobile)
  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-full sm:w-[500px] p-0 flex flex-col bg-background">
        <InboxDetailContent
          item={item}
          onClose={onClose}
          onCreateTask={onCreateTask}
          onMarkComplete={onMarkComplete}
          onArchive={onArchive}
          showCloseButton={true}
        />
      </SheetContent>
    </Sheet>
  );
}
