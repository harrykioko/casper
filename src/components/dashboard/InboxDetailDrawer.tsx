import { format } from "date-fns";
import { ListTodo, Check, Archive, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { InboxItem } from "@/types/inbox";

interface InboxDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  item: InboxItem | null;
  onCreateTask: (item: InboxItem) => void;
  onMarkComplete: (id: string) => void;
  onArchive: (id: string) => void;
}

export function InboxDetailDrawer({
  open,
  onClose,
  item,
  onCreateTask,
  onMarkComplete,
  onArchive,
}: InboxDetailDrawerProps) {
  if (!item) return null;

  // Determine which body content to display
  const bodyContent = item.body || item.preview || "";
  const hasHtmlBody = !!item.htmlBody;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-full sm:w-[500px] p-0 flex flex-col bg-background">
        {/* Header */}
        <SheetHeader className="p-4 border-b border-border/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-primary">
                  {item.senderName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground">{item.senderName}</p>
                <p className="text-sm text-muted-foreground truncate">{item.senderEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {format(new Date(item.receivedAt), "MMM d, h:mm a")}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <SheetTitle className="text-lg font-semibold mt-3 text-left">{item.subject}</SheetTitle>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 p-4 overflow-y-auto">
          {hasHtmlBody ? (
            <div 
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: item.htmlBody || "" }}
            />
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                {bodyContent}
              </p>
            </div>
          )}
          
          {item.relatedCompanyName && (
            <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Related Company</p>
              <p className="text-sm font-medium text-foreground">{item.relatedCompanyName}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border/50 flex gap-2 bg-muted/20">
          <Button onClick={() => onCreateTask(item)} className="flex-1">
            <ListTodo className="mr-2 h-4 w-4" /> Create Task
          </Button>
          <Button variant="secondary" onClick={() => { onMarkComplete(item.id); onClose(); }}>
            <Check className="mr-2 h-4 w-4" /> Complete
          </Button>
          <Button variant="ghost" onClick={() => { onArchive(item.id); onClose(); }}>
            <Archive className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
