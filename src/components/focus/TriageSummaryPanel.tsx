import { cn } from "@/lib/utils";
import {
  Crosshair,
  Mail,
  Calendar,
  ListTodo,
  StickyNote,
  BookOpen,
  AlertCircle,
  Clock,
  Unlink,
  Timer,
  Sparkles,
  CheckCircle2,
  Zap,
  Hourglass,
} from "lucide-react";
import type { WorkItemSourceType, EffortEstimate } from "@/hooks/useWorkQueue";
import type { TriageCounts, TriageFilters } from "@/hooks/useTriageQueue";

interface TriageSummaryPanelProps {
  counts: TriageCounts;
  isAllClear: boolean;
  filters: TriageFilters;
  onToggleSourceType: (type: WorkItemSourceType) => void;
  onToggleReasonCode: (code: string) => void;
  onSetEffortFilter: (effort: EffortEstimate | null) => void;
  onClearFilters: () => void;
}

interface StatChipProps {
  label: string;
  count: number;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  colorClass: string;
}

function StatChip({ label, count, icon, isActive, onClick, colorClass }: StatChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all w-full",
        "border",
        isActive
          ? `${colorClass} border-current`
          : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
      )}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      <span
        className={cn(
          "min-w-[20px] h-5 px-1.5 rounded-full text-xs flex items-center justify-center",
          isActive ? "bg-white/20" : "bg-muted-foreground/10"
        )}
      >
        {count}
      </span>
    </button>
  );
}

const SOURCE_TYPE_ITEMS: Array<{
  value: WorkItemSourceType;
  label: string;
  icon: typeof Mail;
  colorClass: string;
}> = [
  { value: "email", label: "Email", icon: Mail, colorClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "task", label: "Tasks", icon: ListTodo, colorClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  { value: "calendar_event", label: "Meetings", icon: Calendar, colorClass: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  { value: "reading", label: "Reading", icon: BookOpen, colorClass: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400" },
  { value: "note", label: "Notes", icon: StickyNote, colorClass: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
];

const REASON_ITEMS: Array<{
  value: string;
  label: string;
  icon: typeof AlertCircle;
  colorClass: string;
}> = [
  { value: "unprocessed", label: "Unprocessed", icon: BookOpen, colorClass: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  { value: "unlinked_company", label: "Unlinked", icon: Unlink, colorClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  { value: "no_next_action", label: "No Next Action", icon: AlertCircle, colorClass: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
  { value: "stale", label: "Stale", icon: Timer, colorClass: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  { value: "missing_summary", label: "Needs Summary", icon: AlertCircle, colorClass: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400" },
  { value: "waiting", label: "Waiting", icon: Clock, colorClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400" },
];

const EFFORT_ITEMS: Array<{
  value: EffortEstimate;
  label: string;
  icon: typeof Zap;
  colorClass: string;
}> = [
  { value: "quick", label: "Quick (~5 min)", icon: Zap, colorClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { value: "medium", label: "Medium (~15 min)", icon: Timer, colorClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  { value: "long", label: "Long (30+ min)", icon: Hourglass, colorClass: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
];

export function TriageSummaryPanel({
  counts,
  isAllClear,
  filters,
  onToggleSourceType,
  onToggleReasonCode,
  onSetEffortFilter,
  onClearFilters,
}: TriageSummaryPanelProps) {
  const hasActiveFilters = filters.sourceTypes.length > 0 || filters.reasonCodes.length > 0 || !!filters.effortFilter;

  return (
    <div className="sticky top-24 space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            {isAllClear ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            )}
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Triage Queue</h2>
            <p className="text-xs text-muted-foreground">
              {isAllClear
                ? "Everything is accounted for"
                : `${counts.total} item${counts.total !== 1 ? "s" : ""} awaiting judgment`}
            </p>
          </div>
        </div>

        {/* By Source */}
        <div className="space-y-1.5 mb-4">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            By Source
          </p>
          {SOURCE_TYPE_ITEMS.map(item => {
            const count = counts.bySource[item.value] || 0;
            const isActive = filters.sourceTypes.includes(item.value);
            const Icon = item.icon;

            return (
              <StatChip
                key={item.value}
                label={item.label}
                count={count}
                icon={<Icon className="h-4 w-4" />}
                isActive={isActive}
                onClick={() => onToggleSourceType(item.value)}
                colorClass={item.colorClass}
              />
            );
          })}
        </div>

        {/* By Reason */}
        {Object.keys(counts.byReason).length > 0 && (
          <div className="space-y-1.5 mb-4">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
              By Reason
            </p>
            {REASON_ITEMS.map(item => {
              const count = counts.byReason[item.value] || 0;
              const isActive = filters.reasonCodes.includes(item.value);
              const Icon = item.icon;

              if (count === 0 && !isActive) return null;

              return (
                <StatChip
                  key={item.value}
                  label={item.label}
                  count={count}
                  icon={<Icon className="h-4 w-4" />}
                  isActive={isActive}
                  onClick={() => onToggleReasonCode(item.value)}
                  colorClass={item.colorClass}
                />
              );
            })}
          </div>
        )}

        {/* By Effort */}
        <div className="space-y-1.5 mb-4">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            By Effort
          </p>
          {EFFORT_ITEMS.map(item => {
            const count = counts.byEffort[item.value] || 0;
            const isActive = filters.effortFilter === item.value;
            const Icon = item.icon;

            return (
              <StatChip
                key={item.value}
                label={item.label}
                count={count}
                icon={<Icon className="h-4 w-4" />}
                isActive={isActive}
                onClick={() => onSetEffortFilter(item.value)}
                colorClass={item.colorClass}
              />
            );
          })}
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-border">
            <button
              onClick={onClearFilters}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
