import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { StickyNote, BookOpen, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { FocusTriageBar } from "./FocusTriageBar";
import type { FocusQueueItem } from "@/hooks/useFocusQueue";

interface FocusGenericSheetProps {
  open: boolean;
  onClose: () => void;
  item: FocusQueueItem | null;
  onMarkTrusted: () => void;
  onSnooze: (until: Date) => void;
  onNoAction: () => void;
  showLink?: boolean;
  onLink?: () => void;
}

const REASON_LABELS: Record<string, string> = {
  unlinked_company: "Unlinked",
  no_next_action: "No next action",
  stale: "Stale",
  missing_summary: "Needs summary",
  waiting: "Waiting",
};

/**
 * Lightweight sheet for notes and reading items in the Focus queue.
 * Shows title, snippet, reason badges, and triage actions.
 */
export function FocusGenericSheet({
  open,
  onClose,
  item,
  onMarkTrusted,
  onSnooze,
  onNoAction,
  showLink = false,
  onLink,
}: FocusGenericSheetProps) {
  if (!item) return null;

  const isNote = item.source_type === "note";
  const Icon = isNote ? StickyNote : BookOpen;
  const typeLabel = isNote ? "Note" : "Reading";

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        {/* Triage bar */}
        <FocusTriageBar
          onMarkTrusted={onMarkTrusted}
          onSnooze={onSnooze}
          onNoAction={onNoAction}
          showLink={showLink}
          onLink={onLink}
        />

        <SheetHeader className="px-6 pt-5 pb-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Icon className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">{typeLabel}</span>
            {item.created_at && (
              <span className="text-xs text-muted-foreground/60 ml-auto">
                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
              </span>
            )}
          </div>
          <SheetTitle className="text-lg font-semibold text-foreground leading-snug">
            {item.source_title || "Untitled"}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
          {/* Snippet / one-liner */}
          {(item.one_liner || item.source_snippet) && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {item.one_liner || item.source_snippet}
            </p>
          )}

          {/* Reason badges */}
          {item.reason_codes.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Needs attention
              </p>
              <div className="flex flex-wrap gap-1.5">
                {item.reason_codes.map(code => (
                  <Badge
                    key={code}
                    variant="secondary"
                    className="text-xs"
                  >
                    {REASON_LABELS[code] || code}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Entity link info */}
          {item.primary_link && (
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Linked to
              </p>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="capitalize">{item.primary_link.target_type}</span>
                {item.primary_link.link_reason && (
                  <span className="text-xs text-muted-foreground">
                    ({item.primary_link.link_reason})
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Guidance text */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Use the actions above to clear this item from your Focus queue.
              <strong> Trusted</strong> marks it as accounted for.
              <strong> No Action</strong> dismisses it.
              <strong> Snooze</strong> brings it back later.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
