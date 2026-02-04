import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { WorkItemSourceType, WorkItemStatus, WorkQueueCounts } from "@/hooks/useWorkQueue";

interface FocusFiltersPanelProps {
  counts: WorkQueueCounts;
  isSystemClear: boolean;
  statusFilter: WorkItemStatus | 'all';
  onStatusFilterChange: (status: WorkItemStatus | 'all') => void;
  reasonFilter: string[];
  onReasonFilterChange: (reasons: string[]) => void;
  sourceTypeFilter: WorkItemSourceType[];
  onSourceTypeFilterChange: (types: WorkItemSourceType[]) => void;
}

const STATUS_OPTIONS: Array<{ value: WorkItemStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'needs_review', label: 'Needs Review' },
  { value: 'snoozed', label: 'Snoozed' },
];

const REASON_OPTIONS = [
  { value: 'unlinked_company', label: 'Unlinked' },
  { value: 'no_next_action', label: 'No next action' },
  { value: 'missing_summary', label: 'Missing summary' },
  { value: 'stale', label: 'Stale' },
  { value: 'waiting', label: 'Waiting' },
];

const SOURCE_TYPE_OPTIONS: Array<{ value: WorkItemSourceType; label: string }> = [
  { value: 'email', label: 'Email' },
  { value: 'calendar_event', label: 'Meetings' },
  { value: 'task', label: 'Tasks' },
  { value: 'note', label: 'Notes' },
  { value: 'reading', label: 'Reading' },
];

export function FocusFiltersPanel({
  counts,
  isSystemClear,
  statusFilter,
  onStatusFilterChange,
  reasonFilter,
  onReasonFilterChange,
  sourceTypeFilter,
  onSourceTypeFilterChange,
}: FocusFiltersPanelProps) {
  const toggleReason = (reason: string) => {
    if (reasonFilter.includes(reason)) {
      onReasonFilterChange(reasonFilter.filter(r => r !== reason));
    } else {
      onReasonFilterChange([...reasonFilter, reason]);
    }
  };

  const toggleSourceType = (type: WorkItemSourceType) => {
    if (sourceTypeFilter.includes(type)) {
      onSourceTypeFilterChange(sourceTypeFilter.filter(t => t !== type));
    } else {
      onSourceTypeFilterChange([...sourceTypeFilter, type]);
    }
  };

  return (
    <div className="sticky top-24 self-start space-y-6">
      {/* System Clear Indicator */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg border",
        isSystemClear
          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          : "bg-muted/30 border-muted/40 text-muted-foreground"
      )}>
        {isSystemClear ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
        <div>
          <p className="text-sm font-medium">
            {isSystemClear ? "System Clear" : "Items to Review"}
          </p>
          {!isSystemClear && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {counts.needsReview} in review
              {counts.snoozed > 0 && ` · ${counts.snoozed} snoozed`}
            </p>
          )}
        </div>
      </div>

      {/* Status Filter */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
          Status
        </h3>
        <div className="space-y-1">
          {STATUS_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => onStatusFilterChange(option.value)}
              className={cn(
                "w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors",
                statusFilter === option.value
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              {option.label}
              {option.value === 'needs_review' && counts.needsReview > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {counts.needsReview}
                </Badge>
              )}
              {option.value === 'snoozed' && counts.snoozed > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {counts.snoozed}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Reason Filter */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
          <Filter className="h-3 w-3 inline mr-1" />
          Reason
        </h3>
        <div className="space-y-2 px-1">
          {REASON_OPTIONS.map(option => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={reasonFilter.includes(option.value)}
                onCheckedChange={() => toggleReason(option.value)}
              />
              <span className="text-sm text-muted-foreground">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Source Type Filter */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
          Item Type
        </h3>
        <div className="space-y-2 px-1">
          {SOURCE_TYPE_OPTIONS.map(option => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={sourceTypeFilter.length === 0 || sourceTypeFilter.includes(option.value)}
                onCheckedChange={() => toggleSourceType(option.value)}
              />
              <span className="text-sm text-muted-foreground">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
