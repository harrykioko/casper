import { cn } from "@/lib/utils";
import {
  Mail,
  Calendar,
  ListTodo,
  BookOpen,
  Handshake,
  Zap,
  Timer,
  Hourglass,
  AlertTriangle,
  CalendarClock,
  ArrowRight,
  Clock,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { WorkItemSourceType, EffortEstimate } from "@/hooks/useWorkQueue";
import type { TriageCounts, TriageFilters } from "@/hooks/useTriageQueue";

interface CommandFilterPanelProps {
  counts: TriageCounts;
  filters: TriageFilters;
  onToggleSourceType: (type: WorkItemSourceType) => void;
  onSetEffortFilter: (effort: EffortEstimate | null) => void;
  onClearFilters: () => void;
}

interface FilterChipProps {
  label: string;
  count: number;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  colorClass: string;
}

function FilterChip({ label, count, icon, isActive, onClick, colorClass }: FilterChipProps) {
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

const SOURCE_ITEMS: Array<{
  value: WorkItemSourceType;
  label: string;
  icon: typeof Mail;
  colorClass: string;
}> = [
  { value: "email", label: "Email", icon: Mail, colorClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "task", label: "Tasks", icon: ListTodo, colorClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  { value: "commitment", label: "Commitments", icon: Handshake, colorClass: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
  { value: "calendar_event", label: "Meetings", icon: Calendar, colorClass: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  { value: "reading", label: "Reading", icon: BookOpen, colorClass: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400" },
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

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
      {children}
    </p>
  );
}

export function CommandFilterPanel({
  counts,
  filters,
  onToggleSourceType,
  onSetEffortFilter,
  onClearFilters,
}: CommandFilterPanelProps) {
  const [typeOpen, setTypeOpen] = useState(true);
  const [effortOpen, setEffortOpen] = useState(true);
  const hasActiveFilters = filters.sourceTypes.length > 0 || !!filters.effortFilter;

  return (
    <div className="sticky top-24 space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <ListTodo className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground text-sm">Filters</h2>
            <p className="text-xs text-muted-foreground">
              {counts.total} item{counts.total !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* By Type */}
        <Collapsible open={typeOpen} onOpenChange={setTypeOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full mb-2">
            <SectionHeader>Type</SectionHeader>
            <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", typeOpen && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-1.5 mb-4">
              {SOURCE_ITEMS.map(item => {
                const count = counts.bySource[item.value] || 0;
                const isActive = filters.sourceTypes.includes(item.value);
                const Icon = item.icon;
                return (
                  <FilterChip
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
          </CollapsibleContent>
        </Collapsible>

        {/* By Effort */}
        <Collapsible open={effortOpen} onOpenChange={setEffortOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full mb-2">
            <SectionHeader>Effort</SectionHeader>
            <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", effortOpen && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-1.5 mb-4">
              {EFFORT_ITEMS.map(item => {
                const count = counts.byEffort[item.value] || 0;
                const isActive = filters.effortFilter === item.value;
                const Icon = item.icon;
                return (
                  <FilterChip
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
          </CollapsibleContent>
        </Collapsible>

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
