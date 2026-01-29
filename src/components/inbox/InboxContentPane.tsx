import { useState, useMemo } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ChevronDown, Building2, X, Forward, MessageSquareQuote, FileWarning, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cleanEmailContent } from "@/lib/emailCleaners";
import { InboxAttachmentsSection } from "./InboxAttachmentsSection";
import type { InboxItem } from "@/types/inbox";
import type { InboxAttachment } from "@/hooks/useInboxAttachments";

interface InboxContentPaneProps {
  item: InboxItem;
  onClose: () => void;
  hideCloseButton?: boolean;
  onSaveAttachmentToCompany?: (attachment: InboxAttachment) => void;
}

export function InboxContentPane({ item, onClose, hideCloseButton = false, onSaveAttachmentToCompany }: InboxContentPaneProps) {
  const [isRawOpen, setIsRawOpen] = useState(false);
  
  // Prefer server-cleaned content, fallback to client-side cleaning for old items
  const hasServerCleanedContent = !!item.cleanedText;
  
  const bodyContent = item.body || item.preview || "";
  
  // Client-side cleaning fallback (for items ingested before server-side cleaning)
  const clientCleanedEmail = useMemo(() => {
    if (hasServerCleanedContent) return null;
    return cleanEmailContent(bodyContent, item.htmlBody, item.senderName);
  }, [bodyContent, item.htmlBody, item.senderName, hasServerCleanedContent]);
  
  // Display content: prefer server-cleaned, fallback to client-cleaned
  const displayBody = hasServerCleanedContent 
    ? item.cleanedText! 
    : (clientCleanedEmail?.cleanedText || bodyContent);
  
  // Display subject: prefer canonicalized, fallback to raw
  const displaySubject = item.displaySubject || item.subject;
  
  // Original sender (for forwards): prefer display fields, fallback to sender fields
  const displayFromEmail = item.displayFromEmail || item.senderEmail;
  const displayFromName = item.displayFromName || item.senderName;

  const relativeTime = formatDistanceToNow(new Date(item.receivedAt), { addSuffix: true });
  const absoluteTime = format(new Date(item.receivedAt), "MMM d, yyyy 'at' h:mm a");
  const initial = displayFromName.charAt(0).toUpperCase();

  // Determine if we should show forwarding info
  const showForwardingInfo = item.isForwarded && 
    item.displayFromEmail && 
    item.displayFromEmail !== item.senderEmail;

  const getStatusBadge = () => {
    if (item.isDeleted) {
      return <Badge variant="secondary" className="text-[10px] h-5">Archived</Badge>;
    }
    if (item.isResolved) {
      return <Badge variant="secondary" className="text-[10px] h-5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">Resolved</Badge>;
    }
    if (!item.isRead) {
      return <Badge variant="default" className="text-[10px] h-5 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800">New</Badge>;
    }
    return <Badge variant="outline" className="text-[10px] h-5">Open</Badge>;
  };

  // Signal badges for what was stripped
  const signalBadges = [];
  if (item.isForwarded) signalBadges.push({ icon: Forward, label: "Forwarded" });
  if (item.hasThread) signalBadges.push({ icon: MessageSquareQuote, label: "Thread stripped" });
  if (item.hasDisclaimer) signalBadges.push({ icon: FileWarning, label: "Disclaimer stripped" });
  if (item.hasCalendar) signalBadges.push({ icon: Calendar, label: "Calendar stripped" });

  // Check if any cleaning was applied (for showing "View original" toggle)
  const hasCleanedContent = hasServerCleanedContent || 
    (clientCleanedEmail?.cleaningApplied?.length || 0) > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header Section */}
      <div className="flex-shrink-0 p-5 border-b border-border">
        {/* Close button - top right (only if not hidden) */}
        {!hideCloseButton && (
          <div className="flex justify-end mb-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-muted-foreground hover:text-foreground" 
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Sender info row - use display fields for original sender */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-sky-600 dark:text-sky-400">
              {initial}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-foreground">
                {displayFromName}
              </span>
              {getStatusBadge()}
            </div>
            <span className="text-xs text-muted-foreground truncate block">
              {displayFromEmail}
            </span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {relativeTime}
              </span>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{absoluteTime}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Forwarding info (shows who forwarded it) */}
        {showForwardingInfo && (
          <div className="mb-4 p-2.5 rounded-lg bg-muted/30 border border-border">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">
              Forwarded by
            </p>
            <p className="text-xs font-medium text-foreground">
              {item.senderName}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {item.senderEmail}
            </p>
          </div>
        )}

        {/* Subject */}
        <h1 className="text-lg font-semibold text-foreground leading-tight mb-3">
          {displaySubject}
        </h1>

        {/* Signal badges and linked entities */}
        <div className="flex flex-wrap gap-2">
          {/* Processing signal badges */}
          {signalBadges.map(({ icon: Icon, label }) => (
            <Tooltip key={label}>
              <TooltipTrigger asChild>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/50 border border-border text-[10px] text-muted-foreground">
                  <Icon className="h-3 w-3" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          
          {/* Linked company */}
          {item.relatedCompanyName && (
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 border border-border text-xs">
              <Building2 className="h-3 w-3 text-muted-foreground" />
              <span className="text-foreground">{item.relatedCompanyName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* Email body content - use cleaned text */}
        <div className="max-w-prose text-[13px] leading-relaxed text-foreground">
          <p className="whitespace-pre-wrap">{displayBody}</p>
        </div>

        {/* Attachments Section */}
        <div className="mt-6">
          <InboxAttachmentsSection 
            inboxItemId={item.id}
            linkedCompanyId={item.relatedCompanyId || undefined}
            linkedCompanyName={item.relatedCompanyName || undefined}
            onSaveToCompany={onSaveAttachmentToCompany}
          />
        </div>

        {/* Collapsible raw/original section */}
        {hasCleanedContent && (
          <Collapsible 
            open={isRawOpen} 
            onOpenChange={setIsRawOpen}
            className="mt-6"
          >
            <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isRawOpen ? 'rotate-180' : ''}`} />
              View original email
              {signalBadges.length > 0 && (
                <span className="text-[10px] text-muted-foreground/60 ml-1">
                  • {signalBadges.map(b => b.label.replace(" stripped", "")).join(", ")}
                </span>
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="border-l-2 border-muted pl-4 py-2">
                <pre className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground font-mono overflow-x-auto">
                  {bodyContent}
                </pre>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Linked Entities Section */}
        {item.relatedCompanyId && (
          <div className="mt-8 pt-6 border-t border-border">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">
              Linked Entities
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 rounded-lg border border-border bg-muted/30">
                <div className="w-8 h-8 rounded bg-background border border-border flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.relatedCompanyName}</p>
                  <p className="text-[10px] text-muted-foreground">Company</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
