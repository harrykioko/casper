/**
 * FocusCommitmentDrawer - Sheet-based drawer for commitment triage in Focus Queue
 */

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Handshake, StickyNote, Clock, ArrowRight, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { CommitmentTriageBar } from "./CommitmentTriageBar";
import { CounterpartyContextPanel } from "./CounterpartyContextPanel";
import { useFloatingNote } from "@/contexts/FloatingNoteContext";
import { Button } from "@/components/ui/button";
import type { Commitment } from "@/types/commitment";

interface FocusCommitmentDrawerProps {
  open: boolean;
  onClose: () => void;
  commitment: Commitment | null;
  // Triage actions
  onComplete: () => void;
  onSnooze: (until: Date) => void;
  onDelegate: () => void;
  onMarkWaitingOn: () => void;
  onFollowUp: () => void;
  onMarkBroken: () => void;
  onCancel: () => void;
}

export function FocusCommitmentDrawer({
  open,
  onClose,
  commitment,
  onComplete,
  onSnooze,
  onDelegate,
  onMarkWaitingOn,
  onFollowUp,
  onMarkBroken,
  onCancel,
}: FocusCommitmentDrawerProps) {
  const { openFloatingNote } = useFloatingNote();

  const handleOpenFloatingNote = () => {
    if (!commitment) return;
    openFloatingNote({
      target: {
        targetType: "commitment" as any,
        targetId: commitment.id,
        entityName: commitment.title || commitment.content,
      },
      initialData: {
        initialTitle: commitment.title || commitment.content,
      },
    });
  };

  if (!commitment) return null;

  const directionLabel =
    commitment.direction === "owed_to_me" ? "Owed to you" : "You owe";
  const directionColor =
    commitment.direction === "owed_to_me"
      ? "text-blue-400 bg-blue-500/10 border-blue-400/30"
      : "text-amber-400 bg-amber-500/10 border-amber-400/30";
  const DirectionIcon =
    commitment.direction === "owed_to_me" ? ArrowLeft : ArrowRight;

  const relevantDate =
    commitment.direction === "owed_to_me"
      ? commitment.expectedBy
      : commitment.dueAt;
  const dateLabel =
    commitment.direction === "owed_to_me" ? "Expected by" : "Due";

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:w-[480px] lg:w-[520px] p-0 flex flex-col bg-background border-l border-border"
      >
        {/* Triage bar */}
        <CommitmentTriageBar
          direction={commitment.direction}
          status={commitment.status}
          onComplete={onComplete}
          onAddNote={handleOpenFloatingNote}
          onSnooze={onSnooze}
          onDelegate={onDelegate}
          onMarkWaitingOn={onMarkWaitingOn}
          onFollowUp={onFollowUp}
          onMarkBroken={onMarkBroken}
          onCancel={onCancel}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pr-12 py-4 border-b border-border bg-muted/30">
          <SheetTitle className="flex items-center gap-2 text-base font-semibold">
            <Handshake className="w-4 h-4 text-rose-400" />
            Obligation Detail
          </SheetTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
            onClick={handleOpenFloatingNote}
            title="Open floating note"
          >
            <StickyNote className="w-4 h-4 mr-1" />
            Float
          </Button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Direction + Status badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={`text-xs ${directionColor}`}
            >
              <DirectionIcon className="h-3 w-3 mr-1" />
              {directionLabel}
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs ${
                commitment.status === "waiting_on"
                  ? "text-cyan-400 border-cyan-400/30"
                  : commitment.status === "open"
                  ? "text-emerald-400 border-emerald-400/30"
                  : "text-muted-foreground"
              }`}
            >
              {commitment.status}
            </Badge>
          </div>

          {/* Title */}
          {commitment.title && (
            <h3 className="text-lg font-semibold">{commitment.title}</h3>
          )}

          {/* Content */}
          <div className="space-y-1">
            <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Details
            </h4>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {commitment.content}
            </p>
          </div>

          {/* Context */}
          {commitment.context && (
            <div className="space-y-1">
              <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Context
              </h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {commitment.context}
              </p>
            </div>
          )}

          {/* Date + Urgency */}
          <div className="grid grid-cols-2 gap-4">
            {relevantDate && (
              <div className="space-y-1">
                <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  {dateLabel}
                </h4>
                <div className="flex items-center gap-1.5 text-sm">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {format(parseISO(relevantDate), "MMM d, yyyy")}
                </div>
              </div>
            )}
            {commitment.impliedUrgency && (
              <div className="space-y-1">
                <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Urgency
                </h4>
                <Badge variant="secondary" className="text-xs">
                  {formatUrgency(commitment.impliedUrgency)}
                </Badge>
              </div>
            )}
          </div>

          {/* Counterparty context */}
          <div className="border-t border-border pt-4">
            <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Counterparty
            </h4>
            <CounterpartyContextPanel
              personId={commitment.personId}
              personName={commitment.personName}
              companyId={commitment.companyId}
              companyName={commitment.companyName}
              companyType={commitment.companyType}
            />
          </div>

          {/* Source */}
          {commitment.sourceType !== "manual" && (
            <div className="border-t border-border pt-4">
              <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Source
              </h4>
              <div className="text-xs text-muted-foreground">
                Created from {commitment.sourceType}
                {commitment.sourceReference && (
                  <> &mdash; {commitment.sourceReference}</>
                )}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function formatUrgency(urgency: string): string {
  switch (urgency) {
    case "asap": return "ASAP";
    case "today": return "Today";
    case "this_week": return "This week";
    case "next_week": return "Next week";
    case "this_month": return "This month";
    case "when_possible": return "When possible";
    default: return urgency;
  }
}
