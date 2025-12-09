import { useState, useMemo } from "react";
import { format, formatDistanceToNow } from "date-fns";
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

  const relativeTime = formatDistanceToNow(new Date(item.receivedAt), { addSuffix: true });
  const initial = item.senderName.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col h-full">
      {/* Command Bar Header */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800/50 px-5 py-4 rounded-t-2xl">
        <div className="space-y-1.5 min-w-0">
          {/* Metadata row: avatar + from name + from email + relative time */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                {initial}
              </span>
            </div>
            <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
              {item.senderName}
            </span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="hidden sm:inline truncate text-slate-400 dark:text-slate-500">
              {item.senderEmail}
            </span>
            <span className="text-slate-400">•</span>
            <span className="flex-shrink-0">{relativeTime}</span>
          </div>
          
          {/* Subject - prominent title */}
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 text-left">
            {item.subject}
          </h2>
        </div>
        
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
            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <Archive className="h-3.5 w-3.5" />
          </Button>
          {showCloseButton && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 px-5 py-4 overflow-y-auto">
        {/* Related company info card (if present) - at top */}
        {item.relatedCompanyName && (
          <div className="mb-4 p-3 rounded-lg bg-sky-50/50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                  {item.relatedCompanyName.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Related Company</p>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.relatedCompanyName}</p>
              </div>
            </div>
          </div>
        )}

        {/* Email body with max-w-prose */}
        <div className="max-w-prose text-[13px] leading-relaxed text-slate-800 dark:text-slate-200">
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
                  <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isDisclaimerOpen ? 'rotate-180' : ''}`} />
                    View full disclaimer & thread
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-4 py-2">
                      <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-500 dark:text-slate-400">
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

  // Embedded mode - render as workspace card in grid column
  if (mode === 'embedded') {
    return (
      <div className="flex h-full flex-col rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
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
      <SheetContent side="right" className="w-full sm:w-[500px] p-0 flex flex-col bg-white dark:bg-slate-900">
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
