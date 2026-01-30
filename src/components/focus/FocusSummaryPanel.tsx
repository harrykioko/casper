import { cn } from "@/lib/utils";
import { CheckCircle2, Mail, Calendar, ListTodo, StickyNote, BookOpen, AlertCircle, Clock, Unlink, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { WorkItemSourceType } from "@/hooks/useWorkQueue";
import type { FocusCounts, FocusFilters } from "@/hooks/useFocusQueue";

interface FocusSummaryPanelProps {
  counts: FocusCounts;
  isAllClear: boolean;
  filters: FocusFilters;
  onToggleSourceType: (type: WorkItemSourceType) => void;
  onToggleReasonCode: (code: string) => void;
  onClearFilters: () => void;
}

const SOURCE_TYPE_CHIPS: Array<{
  value: WorkItemSourceType;
  label: string;
  icon: typeof Mail;
  color: string;
}> = [
  { value: "email", label: "Email", icon: Mail, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { value: "task", label: "Task", icon: ListTodo, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { value: "calendar_event", label: "Meeting", icon: Calendar, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  { value: "reading", label: "Reading", icon: BookOpen, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  { value: "note", label: "Note", icon: StickyNote, color: "text-green-400 bg-green-500/10 border-green-500/20" },
];

const REASON_CHIPS: Array<{
  value: string;
  label: string;
  icon: typeof AlertCircle;
}> = [
  { value: "unlinked_company", label: "Unlinked", icon: Unlink },
  { value: "no_next_action", label: "No next action", icon: AlertCircle },
  { value: "stale", label: "Stale", icon: Timer },
  { value: "missing_summary", label: "Needs summary", icon: AlertCircle },
  { value: "waiting", label: "Waiting", icon: Clock },
];

export function FocusSummaryPanel({
  counts,
  isAllClear,
  filters,
  onToggleSourceType,
  onToggleReasonCode,
  onClearFilters,
}: FocusSummaryPanelProps) {
  const hasActiveFilters = filters.sourceTypes.length > 0 || filters.reasonCodes.length > 0;

  return (
    <div className="sticky top-24 self-start space-y-6">
      {/* System status */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg border",
          isAllClear
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            : "bg-muted/30 border-muted/40 text-muted-foreground"
        )}
      >
        {isAllClear ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        ) : (
          <Badge variant="secondary" className="text-sm font-semibold px-2 py-0.5">
            {counts.total}
          </Badge>
        )}
        <p className="text-sm font-medium">
          {isAllClear ? "All clear" : `${counts.total} item${counts.total !== 1 ? "s" : ""} need review`}
        </p>
      </div>

      {/* Source type filter chips */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
          Source
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {SOURCE_TYPE_CHIPS.map(chip => {
            const count = counts.bySource[chip.value] || 0;
            const isActive = filters.sourceTypes.includes(chip.value);
            const Icon = chip.icon;

            return (
              <button
                key={chip.value}
                onClick={() => onToggleSourceType(chip.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-all",
                  isActive
                    ? chip.color
                    : "text-muted-foreground bg-transparent border-muted/40 hover:bg-muted/30"
                )}
              >
                <Icon className="h-3 w-3" />
                {chip.label}
                {count > 0 && (
                  <span className="text-[10px] opacity-70">{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reason code filter chips */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
          Reason
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {REASON_CHIPS.map(chip => {
            const count = counts.byReason[chip.value] || 0;
            const isActive = filters.reasonCodes.includes(chip.value);
            const Icon = chip.icon;

            if (count === 0 && !isActive) return null;

            return (
              <button
                key={chip.value}
                onClick={() => onToggleReasonCode(chip.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-all",
                  isActive
                    ? "text-foreground bg-accent border-accent-foreground/20"
                    : "text-muted-foreground bg-transparent border-muted/40 hover:bg-muted/30"
                )}
              >
                <Icon className="h-3 w-3" />
                {chip.label}
                {count > 0 && (
                  <span className="text-[10px] opacity-70">{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
