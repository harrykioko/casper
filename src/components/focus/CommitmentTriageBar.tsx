/**
 * CommitmentTriageBar - 8-action triage bar for commitment items in Focus Queue
 */

import { useState } from "react";
import {
  Check,
  StickyNote,
  Clock,
  Forward,
  Hourglass,
  MessageCircle,
  ShieldX,
  X,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { addHours, addDays, startOfTomorrow, nextMonday } from "date-fns";
import type { Commitment, CommitmentDirection, CommitmentStatus } from "@/types/commitment";

interface CommitmentTriageBarProps {
  direction: CommitmentDirection;
  status: CommitmentStatus;
  onComplete: () => void;
  onAddNote: () => void;
  onSnooze: (until: Date) => void;
  onDelegate: () => void;
  onMarkWaitingOn: () => void;
  onFollowUp: () => void;
  onMarkBroken: () => void;
  onCancel: () => void;
}

const SNOOZE_OPTIONS = [
  { label: "3 hours", getDate: () => addHours(new Date(), 3) },
  { label: "Tomorrow", getDate: () => startOfTomorrow() },
  { label: "Next week", getDate: () => nextMonday(new Date()) },
  { label: "30 days", getDate: () => addDays(new Date(), 30) },
];

export function CommitmentTriageBar({
  direction,
  status,
  onComplete,
  onAddNote,
  onSnooze,
  onDelegate,
  onMarkWaitingOn,
  onFollowUp,
  onMarkBroken,
  onCancel,
}: CommitmentTriageBarProps) {
  const showDelegate = direction === "owed_by_me";
  const showWaitingOn = direction === "owed_by_me" && status === "open";
  const showFollowUp = direction === "owed_to_me" || status === "waiting_on";

  return (
    <div className="flex items-center gap-1 px-4 py-2 bg-muted/50 border-b border-border rounded-t-lg overflow-x-auto">
      {/* 1. Mark Complete */}
      <Button
        size="sm"
        variant="ghost"
        className="h-8 px-2.5 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 flex-shrink-0"
        onClick={onComplete}
      >
        <Check className="h-3.5 w-3.5 mr-1" />
        Complete
      </Button>

      {/* 2. Add Note */}
      <Button
        size="sm"
        variant="ghost"
        className="h-8 px-2.5 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 flex-shrink-0"
        onClick={onAddNote}
      >
        <StickyNote className="h-3.5 w-3.5 mr-1" />
        Note
      </Button>

      {/* 3. Snooze */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2.5 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 flex-shrink-0"
          >
            <Clock className="h-3.5 w-3.5 mr-1" />
            Snooze
            <ChevronDown className="h-3 w-3 ml-0.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[140px]">
          {SNOOZE_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.label}
              onClick={() => onSnooze(option.getDate())}
              className="text-xs"
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 4. Delegate (owed_by_me only) */}
      {showDelegate && (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2.5 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 flex-shrink-0"
          onClick={onDelegate}
        >
          <Forward className="h-3.5 w-3.5 mr-1" />
          Delegate
        </Button>
      )}

      {/* 5. Mark Waiting On (owed_by_me + open) */}
      {showWaitingOn && (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2.5 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 flex-shrink-0"
          onClick={onMarkWaitingOn}
        >
          <Hourglass className="h-3.5 w-3.5 mr-1" />
          Waiting On
        </Button>
      )}

      {/* 6. Follow Up (owed_to_me or waiting_on) */}
      {showFollowUp && (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2.5 text-xs text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 flex-shrink-0"
          onClick={onFollowUp}
        >
          <MessageCircle className="h-3.5 w-3.5 mr-1" />
          Follow Up
        </Button>
      )}

      {/* 7. Mark Broken */}
      <Button
        size="sm"
        variant="ghost"
        className="h-8 px-2.5 text-xs text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 flex-shrink-0"
        onClick={onMarkBroken}
      >
        <ShieldX className="h-3.5 w-3.5 mr-1" />
        Broken
      </Button>

      {/* 8. Cancel */}
      <Button
        size="sm"
        variant="ghost"
        className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground flex-shrink-0"
        onClick={onCancel}
      >
        <X className="h-3.5 w-3.5 mr-1" />
        Cancel
      </Button>
    </div>
  );
}
