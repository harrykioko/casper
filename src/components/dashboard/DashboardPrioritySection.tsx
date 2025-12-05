import { useState } from "react";
import { AlertTriangle, Clock, AlertCircle, CheckCircle2, Plus, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { usePriorityItems, PriorityType, PriorityItem } from "@/hooks/usePriorityItems";
import { GlassPanel, GlassPanelHeader, GlassSubcard } from "@/components/ui/glass-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskPrefillOptions } from "@/types/inbox";
import { toast } from "sonner";

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
    color: "text-status-danger",
    bgColor: "bg-status-danger/10",
    label: "Overdue",
  },
  due_today: {
    icon: Clock,
    color: "text-status-warning",
    bgColor: "bg-status-warning/10",
    label: "Due Today",
  },
  stale: {
    icon: AlertCircle,
    color: "text-status-warning",
    bgColor: "bg-status-warning/10",
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
    // For now, optimistically remove from local list
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
      <GlassPanel className="h-full">
        <GlassPanelHeader title="Priority Items" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </GlassPanel>
    );
  }

  if (visibleItems.length === 0) {
    return (
      <GlassPanel className="h-full">
        <GlassPanelHeader title="Priority Items" />
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-status-active/10 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6 text-status-active" />
          </div>
          <p className="text-sm text-muted-foreground">All caught up!</p>
          <p className="text-xs text-muted-foreground/70 mt-1">No priority items right now.</p>
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="h-full flex flex-col">
      <GlassPanelHeader title="Priority Items" />
      <div className="space-y-3 flex-1">
        {visibleItems.slice(0, 4).map((item) => {
          const config = priorityConfig[item.type];
          const Icon = config.icon;

          return (
            <GlassSubcard
              key={item.id}
              onClick={() => onCompanyClick(item.companyId, item.entityType)}
              className="group"
            >
              <div className="flex items-center gap-3">
                {/* Status icon */}
                <div
                  className={`w-9 h-9 rounded-xl ${config.bgColor} flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>

                {/* Company logo */}
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-border/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {item.companyLogo ? (
                    <img
                      src={item.companyLogo}
                      alt={item.companyName}
                      className="max-w-full max-h-full object-contain p-1"
                    />
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground">
                      {item.companyName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm text-foreground truncate">
                      {item.companyName}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.color} font-medium`}
                    >
                      {config.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                </div>

                {/* Quick Actions (appear on hover) */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  {/* Snooze */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
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
                    className="h-7 w-7"
                    onClick={(e) => handleResolve(e, item.id)}
                    title="Resolve"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>

                  {/* Create Task */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => handleCreateTask(e, item)}
                    title="Create task"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Timestamp (hidden on hover) */}
                {item.timestamp && (
                  <span className="text-xs text-muted-foreground/70 flex-shrink-0 group-hover:hidden">
                    {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                  </span>
                )}
              </div>
            </GlassSubcard>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-white/10 dark:border-white/5 flex items-center justify-between">
        <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
          View all priority
        </button>
        <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
          Mark all as seen
        </button>
      </div>
    </GlassPanel>
  );
}
