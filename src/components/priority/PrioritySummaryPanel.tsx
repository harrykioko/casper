import { 
  AlertTriangle, 
  Clock, 
  CheckSquare,
  Mail,
  Calendar,
  Sparkles,
  ChevronRight,
  CheckCircle,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PriorityItem } from "@/types/priority";
import { 
  getPriorityCounts, 
  getProposedPriorityActions,
  type PriorityViewFilter,
  type ProposedPriorityAction,
} from "./priorityHelpers";

interface PrioritySummaryPanelProps {
  items: PriorityItem[];
  topPriorityItems?: PriorityItem[];
  activeFilter: PriorityViewFilter;
  onFilterChange: (filter: PriorityViewFilter) => void;
  onItemClick: (item: PriorityItem) => void;
  onResolveItem: (item: PriorityItem) => void;
  onToggleTopPriority?: (item: PriorityItem, isTop: boolean) => void;
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
      <span className={cn(
        "min-w-[20px] h-5 px-1.5 rounded-full text-xs flex items-center justify-center",
        isActive ? "bg-white/20" : "bg-muted-foreground/10"
      )}>
        {count}
      </span>
    </button>
  );
}

function ProposedActionRow({ 
  action, 
  onOpen, 
  onResolve,
  onToggleTopPriority,
}: { 
  action: ProposedPriorityAction;
  onOpen: () => void;
  onResolve: () => void;
  onToggleTopPriority?: (isTop: boolean) => void;
}) {
  const canResolve = action.item.sourceType === "task" || action.item.sourceType === "inbox";
  const canToggleTopPriority = action.item.sourceType === "task" || action.item.sourceType === "inbox";
  
  return (
    <div className="p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
            {action.item.title.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {action.item.title}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {action.item.subtitle || action.item.reasoning}
          </p>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
            {action.reason}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-2">
        {canToggleTopPriority && onToggleTopPriority && (
          <Button 
            size="sm" 
            variant={action.item.isTopPriority ? "default" : "outline"}
            onClick={() => onToggleTopPriority(!action.item.isTopPriority)}
            className={cn(
              "h-6 text-[11px] px-2",
              action.item.isTopPriority && "bg-amber-500 hover:bg-amber-600 text-white"
            )}
          >
            <Star className={cn("h-3 w-3 mr-1", action.item.isTopPriority && "fill-current")} />
            {action.item.isTopPriority ? "Flagged" : "Flag"}
          </Button>
        )}
        <Button 
          size="sm" 
          variant="ghost"
          onClick={onOpen}
          className="h-6 text-[11px] flex-1 px-2"
        >
          Open
          <ChevronRight className="h-3 w-3 ml-0.5" />
        </Button>
        {canResolve && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={onResolve}
            className="h-6 text-[11px] px-2"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Done
          </Button>
        )}
      </div>
    </div>
  );
}

export function PrioritySummaryPanel({
  items,
  topPriorityItems = [],
  activeFilter,
  onFilterChange,
  onItemClick,
  onResolveItem,
  onToggleTopPriority,
}: PrioritySummaryPanelProps) {
  const counts = getPriorityCounts(items);
  const proposedActions = getProposedPriorityActions(items, 4);

  // Use topPriorityItems for the "Top Priority" section if available
  const displayTopPriority = topPriorityItems.length > 0 
    ? topPriorityItems.slice(0, 3).map(item => ({ item, reason: "Flagged by you" }))
    : proposedActions.slice(0, 3);

  return (
    <div className="sticky top-24 space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Priority Command</h2>
            <p className="text-xs text-muted-foreground">Focus on what matters</p>
          </div>
        </div>

        {/* Urgency Filters */}
        <div className="space-y-1.5 mb-4">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            By Urgency
          </p>
          <StatChip
            label="All Items"
            count={counts.all}
            icon={<AlertTriangle className="h-4 w-4" />}
            isActive={activeFilter === 'all'}
            onClick={() => onFilterChange('all')}
            colorClass="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          />
          <StatChip
            label="Overdue"
            count={counts.overdue}
            icon={<AlertTriangle className="h-4 w-4" />}
            isActive={activeFilter === 'overdue'}
            onClick={() => onFilterChange('overdue')}
            colorClass="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          />
          <StatChip
            label="Due Today"
            count={counts.dueToday}
            icon={<Clock className="h-4 w-4" />}
            isActive={activeFilter === 'due-today'}
            onClick={() => onFilterChange('due-today')}
            colorClass="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          />
          <StatChip
            label="Due Soon"
            count={counts.dueSoon}
            icon={<Clock className="h-4 w-4" />}
            isActive={activeFilter === 'due-soon'}
            onClick={() => onFilterChange('due-soon')}
            colorClass="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
          />
        </div>

        {/* Source Filters */}
        <div className="space-y-1.5 mb-4">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            By Source
          </p>
          <StatChip
            label="Tasks"
            count={counts.tasks}
            icon={<CheckSquare className="h-4 w-4" />}
            isActive={activeFilter === 'tasks'}
            onClick={() => onFilterChange('tasks')}
            colorClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          />
          <StatChip
            label="Inbox"
            count={counts.inbox}
            icon={<Mail className="h-4 w-4" />}
            isActive={activeFilter === 'inbox'}
            onClick={() => onFilterChange('inbox')}
            colorClass="bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
          />
          <StatChip
            label="Calendar"
            count={counts.calendar}
            icon={<Calendar className="h-4 w-4" />}
            isActive={activeFilter === 'calendar'}
            onClick={() => onFilterChange('calendar')}
            colorClass="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
          />
        </div>

        {/* Top Priority Section */}
        {displayTopPriority.length > 0 && (
          <div className="pt-4 border-t border-border">
            <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-amber-500" />
              {topPriorityItems.length > 0 ? "Your Top Priority" : "Suggested Priority"}
            </h3>
            <div className="space-y-1.5">
              {displayTopPriority.map((action) => (
                <ProposedActionRow
                  key={action.item.id}
                  action={action}
                  onOpen={() => onItemClick(action.item)}
                  onResolve={() => onResolveItem(action.item)}
                  onToggleTopPriority={onToggleTopPriority 
                    ? (isTop) => onToggleTopPriority(action.item, isTop)
                    : undefined
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
