import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { ChevronDown, X, Forward, MessageSquareQuote, FileWarning, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cleanEmailContent } from "@/lib/emailCleaners";
import { InboxAttachmentsSection } from "./InboxAttachmentsSection";
import { StructuredSummaryCard, GenerateSummaryPlaceholder } from "./StructuredSummaryCard";
import { useEmailExtraction, type ExtractionResult } from "@/hooks/useEmailExtraction";
import type { InboxItem } from "@/types/inbox";
import type { InboxAttachment } from "@/hooks/useInboxAttachments";

interface InboxContentPaneProps {
  item: InboxItem;
  onClose: () => void;
  hideCloseButton?: boolean;
  onSaveAttachmentToCompany?: (attachment: InboxAttachment) => void;
  onUnlinkCompany?: (id: string) => void;
}

export function InboxContentPane({ 
  item, 
  onClose, 
  hideCloseButton = false, 
  onSaveAttachmentToCompany,
  onUnlinkCompany,
}: InboxContentPaneProps) {
  const [isRawOpen, setIsRawOpen] = useState(false);
  const [localExtraction, setLocalExtraction] = useState<ExtractionResult | null>(null);
  const navigate = useNavigate();
  const { extractAsync, isExtracting, error: extractionError } = useEmailExtraction();
  
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

  // Signal badges for "View original" trigger
  const signalBadges = [];
  if (item.isForwarded) signalBadges.push({ icon: Forward, label: "Forwarded" });
  if (item.hasThread) signalBadges.push({ icon: MessageSquareQuote, label: "Thread" });
  if (item.hasDisclaimer) signalBadges.push({ icon: FileWarning, label: "Disclaimer" });
  if (item.hasCalendar) signalBadges.push({ icon: Calendar, label: "Calendar" });

  // Handle company click - navigate to the correct page
  const handleCompanyClick = () => {
    if (item.relatedCompanyId && item.relatedCompanyType) {
      const path = item.relatedCompanyType === 'pipeline' 
        ? `/pipeline/${item.relatedCompanyId}`
        : `/portfolio/${item.relatedCompanyId}`;
      navigate(path);
    }
  };

  // Handle unlink
  const handleUnlink = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUnlinkCompany?.(item.id);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header Section - tighter padding */}
      <div className="flex-shrink-0 px-5 py-4 border-b border-border/50">
        {/* Close button - top right (only if not hidden) */}
        {!hideCloseButton && (
          <div className="flex justify-end mb-2">
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

        {/* Sender info row - compact layout */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center flex-shrink-0">
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
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="truncate">{displayFromEmail}</span>
              {/* Subtle forwarded indicator */}
              {showForwardingInfo && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/70 flex-shrink-0">
                      <Forward className="h-2.5 w-2.5" />
                      via {item.senderName?.split(' ')[0]}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">Forwarded by {item.senderName}</p>
                    <p className="text-muted-foreground">{item.senderEmail}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
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

        {/* Subject - slightly smaller */}
        <h1 className="text-base font-semibold text-foreground leading-snug">
          {displaySubject}
        </h1>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* Structured Summary (when available) or Generate Placeholder */}
        {item.extractedAt || localExtraction ? (
          <StructuredSummaryCard
            summary={localExtraction?.summary || item.extractedSummary || ""}
            keyPoints={localExtraction?.keyPoints || item.extractedKeyPoints || []}
            nextStep={localExtraction?.nextStep || item.extractedNextStep || { label: "No action required", isActionRequired: false }}
            categories={localExtraction?.categories || item.extractedCategories || []}
            entities={localExtraction?.entities || item.extractedEntities || []}
            people={localExtraction?.people || item.extractedPeople || []}
          />
        ) : (
          <GenerateSummaryPlaceholder
            onGenerate={async () => {
              try {
                const result = await extractAsync(item.id);
                setLocalExtraction(result);
              } catch {
                // Error handled by hook
              }
            }}
            isGenerating={isExtracting}
            error={extractionError}
          />
        )}

        {/* Attachments Section */}
        <div className="mt-6">
          <InboxAttachmentsSection 
            inboxItemId={item.id}
            linkedCompanyId={item.relatedCompanyId || undefined}
            linkedCompanyName={item.relatedCompanyName || undefined}
            onSaveToCompany={onSaveAttachmentToCompany}
          />
        </div>

        {/* Linked Entities Section */}
        {item.relatedCompanyId && (
          <div className="mt-6">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">
              Linked Entities
            </h3>
            <div className="space-y-2">
              <div 
                className="flex items-center gap-3 p-2 rounded-lg border border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors group"
                onClick={handleCompanyClick}
              >
                {/* Company Logo or Fallback */}
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={item.relatedCompanyLogoUrl || undefined} 
                    alt={item.relatedCompanyName || 'Company'} 
                  />
                  <AvatarFallback className="text-xs bg-background border border-border">
                    {item.relatedCompanyName?.slice(0, 2).toUpperCase() || 'CO'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.relatedCompanyName}
                  </p>
                  <p className="text-[10px] text-muted-foreground capitalize">
                    {item.relatedCompanyType || 'Company'}
                  </p>
                </div>
                
                {/* Remove link button */}
                {onUnlinkCompany && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleUnlink}
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Collapsible raw/original section - with signal badges in trigger */}
        <Collapsible 
          open={isRawOpen} 
          onOpenChange={setIsRawOpen}
          className="mt-6"
        >
          <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isRawOpen ? 'rotate-180' : ''}`} />
            <span>View original email</span>
            {signalBadges.length > 0 && (
              <span className="flex items-center gap-1 ml-1">
                {signalBadges.map(({ icon: Icon, label }) => (
                  <Tooltip key={label}>
                    <TooltipTrigger asChild>
                      <Icon className="h-3 w-3 text-muted-foreground/50" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{label}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </span>
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="border-l-2 border-muted pl-4 py-2">
              <pre className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground font-mono overflow-x-auto">
                {displayBody || bodyContent}
              </pre>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
