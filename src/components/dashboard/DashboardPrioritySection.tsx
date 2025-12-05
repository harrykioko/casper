import { useState } from "react";
import { AlertTriangle, Clock, AlertCircle, CheckCircle2, Plus, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { usePriorityItems, PriorityType, PriorityItem } from "@/hooks/usePriorityItems";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ActionPanel,
  ActionPanelHeader,
  ActionPanelListArea,
  ActionPanelRow,
  ActionPanelFooter,
  LiveBadge,
} from "@/components/ui/action-panel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskPrefillOptions } from "@/types/inbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DashboardPrioritySectionProps {
  onCompanyClick: (companyId: string, entityType: "portfolio" | "pipeline") => void;
  onOpenTaskCreate?: (options: TaskPrefillOptions) => void;
}

const priorityConfig: Record<
  PriorityType,
  { icon: typeof AlertTriangle; color: string; bgColor: string; label: string }
> = {
  overdue: {
    icon: AlertTriangle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    label: "Overdue",
  },
  due_today: {
    icon: Clock,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    label: "Due Today",
  },
  stale: {
    icon: AlertCircle,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    label: "Needs Attention",
  },
};

export function DashboardPrioritySection({
  onCompanyClick,
  onOpenTaskCreate,
}: DashboardPrioritySectionProps) {
  const { priorityItems, loading } = usePriorityItems();
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  const handleSnooze = (
    e: React.MouseEvent,
    itemId: string,
    duration: "later_today" | "tomorrow" | "next_week" | "custom"
  ) => {
    e.stopPropagation();
    // TODO: Wire to backend snooze/defer mechanism when available
    console.log("Snooze priority item:", itemId, duration);
    const durationLabels = {
      later_today: "later today",
      tomorrow: "tomorrow",
      next_week: "next week",
      custom: "custom time",
    };
    toast.info(`Snoozed until ${durationLabels[duration]}`);
  };

  const handleResolve = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    // TODO: Wire to backend - mark underlying task as done or clear priority state
    setResolvedIds((prev) => new Set(prev).add(itemId));
    toast.success("Item resolved");
  };

  const handleCreateTask = (e: React.MouseEvent, item: PriorityItem) => {
    e.stopPropagation();
    if (onOpenTaskCreate) {
      onOpenTaskCreate({
        content: `Follow up with ${item.companyName}`,
        companyId: item.companyId,
        companyType: item.entityType,
        companyName: item.companyName,
        dueDate: new Date(),
      });
    }
  };

  // Filter out resolved items
  const visibleItems = priorityItems.filter((item) => !resolvedIds.has(item.id));

  if (loading) {
    return (
      <ActionPanel accentColor="amber" className="h-full">
        <ActionPanelHeader
          icon={<AlertTriangle className="h-4 w-4" />}
          title="Priority Items"
          subtitle="Loading..."
          accentColor="amber"
        />
        <ActionPanelListArea accentColor="amber">
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        </ActionPanelListArea>
      </ActionPanel>
    );
  }

  if (visibleItems.length === 0) {
    return (
      <ActionPanel accentColor="amber" className="h-full">
        <ActionPanelHeader
          icon={<AlertTriangle className="h-4 w-4" />}
          title="Priority Items"
          subtitle="0 requiring attention"
          accentColor="amber"
        />
        <ActionPanelListArea accentColor="amber" className="flex items-center justify-center">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">All caught up!</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">No priority items right now.</p>
          </div>
        </ActionPanelListArea>
      </ActionPanel>
    );
  }

  return (
    <ActionPanel accentColor="amber" className="h-full">
      <ActionPanelHeader
        icon={<AlertTriangle className="h-4 w-4" />}
        title="Priority Items"
        subtitle={`${visibleItems.length} requiring attention`}
        badge={<LiveBadge accentColor="amber" />}
        accentColor="amber"
      />

      <ActionPanelListArea accentColor="amber" className="overflow-y-auto max-h-[280px]">
        {visibleItems.slice(0, 5).map((item, index) => {
          const config = priorityConfig[item.type];
          const Icon = config.icon;
          const isLast = index === Math.min(visibleItems.length, 5) - 1;

          return (
            <ActionPanelRow
              key={item.id}
              onClick={() => onCompanyClick(item.companyId, item.entityType)}
              isLast={isLast}
            >
              {/* Left content */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Status icon */}
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                    config.bgColor
                  )}
                >
                  <Icon className={cn("w-4 h-4", config.color)} />
                </div>

                {/* Company logo */}
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {item.companyLogo ? (
                    <img
                      src={item.companyLogo}
                      alt={item.companyName}
                      className="max-w-full max-h-full object-contain p-1"
                    />
                  ) : (
                    <span className="text-sm font-medium text-slate-500">
                      {item.companyName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm text-slate-700 dark:text-slate-200 truncate">
                      {item.companyName}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0",
                        config.bgColor,
                        config.color
                      )}
                    >
                      {config.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.description}</p>
                </div>
              </div>

              {/* Right side */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Quick Actions (appear on hover) */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Snooze */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                        onClick={(e) => e.stopPropagation()}
                        title="Snooze"
                      >
                        <Clock className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover">
                      <DropdownMenuItem onClick={(e) => handleSnooze(e as any, item.id, "later_today")}>
                        Later today
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleSnooze(e as any, item.id, "tomorrow")}>
                        Tomorrow
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleSnooze(e as any, item.id, "next_week")}>
                        Next week
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleSnooze(e as any, item.id, "custom")}>
                        Custom...
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Resolve */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-500 hover:text-emerald-600"
                    onClick={(e) => handleResolve(e, item.id)}
                    title="Resolve"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>

                  {/* Create Task */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                    onClick={(e) => handleCreateTask(e, item)}
                    title="Create task"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Timestamp (hidden on hover) */}
                {item.timestamp && (
                  <span className="text-[10px] text-slate-400 group-hover:hidden">
                    {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                  </span>
                )}
              </div>
            </ActionPanelRow>
          );
        })}
      </ActionPanelListArea>

      <ActionPanelFooter>
        <button className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
          View all priority
        </button>
        <button className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-slate-900/5 dark:bg-slate-50/5 text-slate-500 dark:text-slate-300 hover:bg-slate-900/10 dark:hover:bg-slate-50/10 transition-colors">
          <CheckCircle className="h-3 w-3" />
          Mark all as seen
        </button>
      </ActionPanelFooter>
    </ActionPanel>
  );
}
