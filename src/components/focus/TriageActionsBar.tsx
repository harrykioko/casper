import { useState } from "react";
import { CheckCircle, Clock, Ban, Link2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { addHours, addDays, startOfTomorrow, nextMonday } from "date-fns";

interface TriageActionsBarProps {
  onMarkTrusted: () => void;
  onSnooze: (until: Date) => void;
  onNoAction: () => void;
  onLink?: () => void;
  showLink?: boolean;
}

const SNOOZE_OPTIONS = [
  { label: "1 hour", getDate: () => addHours(new Date(), 1) },
  { label: "4 hours", getDate: () => addHours(new Date(), 4) },
  { label: "Tomorrow", getDate: () => startOfTomorrow() },
  { label: "Next week", getDate: () => nextMonday(new Date()) },
  { label: "3 days", getDate: () => addDays(new Date(), 3) },
];

export function TriageActionsBar({
  onMarkTrusted,
  onSnooze,
  onNoAction,
  onLink,
  showLink = false,
}: TriageActionsBarProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-b border-border rounded-t-lg">
      <Button
        size="sm"
        variant="ghost"
        className="h-8 px-3 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
        onClick={onMarkTrusted}
      >
        <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
        Trusted
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-3 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
          >
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            Snooze
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[140px]">
          {SNOOZE_OPTIONS.map(option => (
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

      <Button
        size="sm"
        variant="ghost"
        className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
        onClick={onNoAction}
      >
        <Ban className="h-3.5 w-3.5 mr-1.5" />
        No Action
      </Button>

      {showLink && onLink && (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-3 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
          onClick={onLink}
        >
          <Link2 className="h-3.5 w-3.5 mr-1.5" />
          Link
        </Button>
      )}
    </div>
  );
}
