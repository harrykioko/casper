import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ListTodo, Check, Archive, X, ChevronDown } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { InboxItem } from "@/types/inbox";

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

  return (
    <>
      {/* Sticky Header with actions */}
      <div className="sticky top-0 z-10 bg-background border-b border-border/50 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Sender info + date */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-sky-600 dark:text-sky-400">
                {item.senderName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.senderName}
                </p>
                <span className="text-[11px] text-muted-foreground flex-shrink-0">
                  {format(new Date(item.receivedAt), "MMM d, h:mm a")}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                {item.senderEmail}
              </p>
            </div>
          </div>

          {/* Right: Actions + Close */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button 
              size="sm" 
              onClick={() => onCreateTask(item)} 
              className="bg-sky-600 hover:bg-sky-700 text-white h-8 px-3 text-xs"
            >
              <ListTodo className="mr-1.5 h-3.5 w-3.5" /> Task
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => { onMarkComplete(item.id); onClose(); }}
              className="h-8 px-3 text-xs"
            >
              <Check className="mr-1.5 h-3.5 w-3.5" /> Complete
            </Button>
            {showCloseButton && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Subject line - prominent title */}
        <h2 className="text-base font-semibold text-foreground mt-3 line-clamp-2 text-left">
          {item.subject}
        </h2>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 px-5 py-4 overflow-y-auto">
        {/* Related company info card (if present) - at top */}
        {item.relatedCompanyName && (
          <div className="mb-4 p-3 rounded-lg bg-sky-50/50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-white dark:bg-slate-800 border border-border/50 flex items-center justify-center flex-shrink-0">
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
        <div className="max-w-prose">
          {hasHtmlBody ? (
            <div 
              className="prose prose-sm dark:prose-invert max-w-none text-[13px] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: item.htmlBody || "" }}
            />
          ) : (
            <>
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">
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
                    <div className="border-l-2 border-border pl-4 py-2">
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

      {/* Minimal Sticky Footer with Archive */}
      <div className="sticky bottom-0 px-5 py-2.5 border-t border-border/50 bg-background/95 backdrop-blur-sm flex items-center justify-end">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => { onArchive(item.id); onClose(); }}
          className="text-muted-foreground hover:text-foreground h-8 px-3 text-xs"
        >
          <Archive className="mr-1.5 h-3.5 w-3.5" />
          Archive
        </Button>
      </div>
    </>
  );
}

interface InboxDetailDrawerProps {
  mode?: 'sheet' | 'embedded';
  open: boolean;
  onClose: () => void;
  item: InboxItem | null;
  onCreateTask: (item: InboxItem) => void;
  onMarkComplete: (id: string) => void;
  onArchive: (id: string) => void;
}

export function InboxDetailDrawer({
  mode = 'sheet',
  open,
  onClose,
  item,
  onCreateTask,
  onMarkComplete,
  onArchive,
}: InboxDetailDrawerProps) {
  if (!item) return null;

  // Embedded mode - render as plain div in grid column
  if (mode === 'embedded') {
    return (
      <div className="flex flex-col h-full border border-border/50 bg-background rounded-xl shadow-sm overflow-hidden">
        <InboxDetailContent
          item={item}
          onClose={onClose}
          onCreateTask={onCreateTask}
          onMarkComplete={onMarkComplete}
          onArchive={onArchive}
          showCloseButton={true}
        />
      </div>
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
