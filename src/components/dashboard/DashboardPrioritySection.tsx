import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  AlertTriangle, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  CheckCircle,
  Mail,
  Calendar,
  Flag,
  Star,
  BookOpen,
  CheckSquare
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useUnifiedPriorityV1 } from "@/hooks/useUnifiedPriorityV1";
import type { PriorityItem, PriorityIconType, PrioritySourceType } from "@/types/priority";
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
import { useTasks } from "@/hooks/useTasks";
import { useInboxItems } from "@/hooks/useInboxItems";

interface DashboardPrioritySectionProps {
  onCompanyClick: (companyId: string, entityType: "portfolio" | "pipeline") => void;
  onOpenTaskCreate?: (options: TaskPrefillOptions) => void;
  onOpenTaskDetails?: (taskId: string) => void;
  onOpenInboxDetail?: (inboxId: string) => void;
  onOpenEventDetail?: (eventId: string) => void;
}

// Icon configuration mapped by PriorityIconType
const iconConfig: Record<
  PriorityIconType,
  { icon: typeof AlertTriangle; color: string; bgColor: string; label: string }
> = {
  "overdue": {
    icon: AlertTriangle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    label: "Overdue",
  },
  "due-today": {
    icon: Clock,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    label: "Due Today",
  },
  "due-soon": {
    icon: Clock,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    label: "Due Soon",
  },
  "stale-company": {
    icon: AlertCircle,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    label: "Needs Attention",
  },
  "unread-email": {
    icon: Mail,
    color: "text-sky-600 dark:text-sky-400",
    bgColor: "bg-sky-100 dark:bg-sky-900/30",
    label: "Inbox",
  },
  "upcoming-event": {
    icon: Calendar,
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-100 dark:bg-violet-900/30",
    label: "Event",
  },
  "unread-reading": {
    icon: BookOpen,
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-100 dark:bg-rose-900/30",
    label: "Reading",
  },
  "nonnegotiable": {
    icon: Star,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    label: "Habit",
  },
  "high-importance": {
    icon: Flag,
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-100 dark:bg-rose-900/30",
    label: "High Priority",
  },
};

// Default config for unknown icon types
const defaultIconConfig = {
  icon: CheckSquare,
  color: "text-slate-600 dark:text-slate-400",
  bgColor: "bg-slate-100 dark:bg-slate-900/30",
  label: "Task",
};

// Get source type icon for items without company context
function getSourceIcon(sourceType: PrioritySourceType) {
  switch (sourceType) {
    case "task":
      return CheckSquare;
    case "inbox":
      return Mail;
    case "calendar_event":
      return Calendar;
    case "portfolio_company":
    case "pipeline_company":
      return AlertCircle;
    default:
      return CheckSquare;
  }
}

export function DashboardPrioritySection({
  onCompanyClick,
  onOpenTaskCreate,
  onOpenTaskDetails,
  onOpenInboxDetail,
  onOpenEventDetail,
}: DashboardPrioritySectionProps) {
  const navigate = useNavigate();
  const { items: priorityItems, loading, totalCount } = useUnifiedPriorityV1();
  const { updateTask } = useTasks();
  const { markComplete: markInboxComplete } = useInboxItems();
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  const handleSnooze = (
    e: React.MouseEvent,
    item: PriorityItem,
    duration: "later_today" | "tomorrow" | "next_week" | "custom"
  ) => {
    e.stopPropagation();
    // TODO: Wire to backend snooze/defer mechanism per source type
    console.log("Snooze priority item:", item.id, item.sourceType, duration);
    const durationLabels = {
      later_today: "later today",
      tomorrow: "tomorrow",
      next_week: "next week",
      custom: "custom time",
    };
    toast.info(`Snoozed until ${durationLabels[duration]}`);
  };

  const handleResolve = (e: React.MouseEvent, item: PriorityItem) => {
    e.stopPropagation();
    
    // Handle resolution based on source type
    switch (item.sourceType) {
      case "task":
        updateTask(item.sourceId, { completed: true });
        break;
      case "inbox":
        markInboxComplete(item.sourceId);
        break;
      default:
        // For other types, just mark as resolved locally
        break;
    }
    
    setResolvedIds((prev) => new Set(prev).add(item.id));
    toast.success("Item resolved");
  };

  const handleCreateTask = (e: React.MouseEvent, item: PriorityItem) => {
    e.stopPropagation();
    if (onOpenTaskCreate) {
      onOpenTaskCreate({
        content: item.companyName 
          ? `Follow up: ${item.title}` 
          : item.title,
        companyId: item.companyId || undefined,
        companyType: item.sourceType === "portfolio_company" ? "portfolio" : 
                     item.sourceType === "pipeline_company" ? "pipeline" : undefined,
        companyName: item.companyName || undefined,
        dueDate: new Date(),
      });
    }
  };

  const handleItemClick = (item: PriorityItem) => {
    switch (item.sourceType) {
      case "task":
        if (item.companyId) {
          // If task is linked to a company, open company pane
          const entityType = item.contextLabels?.includes("Pipeline") ? "pipeline" : "portfolio";
          onCompanyClick(item.companyId, entityType);
        } else if (onOpenTaskDetails) {
          // Otherwise open task details
          onOpenTaskDetails(item.sourceId);
        }
        break;
      case "inbox":
        if (onOpenInboxDetail) {
          onOpenInboxDetail(item.sourceId);
        }
        break;
      case "calendar_event":
        if (onOpenEventDetail) {
          onOpenEventDetail(item.sourceId);
        }
        break;
      case "portfolio_company":
        if (item.companyId) {
          onCompanyClick(item.companyId, "portfolio");
        }
        break;
      case "pipeline_company":
        if (item.companyId) {
          onCompanyClick(item.companyId, "pipeline");
        }
        break;
      default:
        console.log("Unhandled source type click:", item.sourceType);
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
        {visibleItems.slice(0, 8).map((item, index) => {
          const config = item.iconType ? iconConfig[item.iconType] : defaultIconConfig;
          const Icon = config?.icon || defaultIconConfig.icon;
          const isLast = index === Math.min(visibleItems.length, 8) - 1;
          const SourceIcon = getSourceIcon(item.sourceType);

          return (
            <ActionPanelRow
              key={item.id}
              onClick={() => handleItemClick(item)}
              isLast={isLast}
            >
              {/* Left content */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Status icon */}
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                    config?.bgColor || defaultIconConfig.bgColor
                  )}
                >
                  <Icon className={cn("w-4 h-4", config?.color || defaultIconConfig.color)} />
                </div>

                {/* Avatar/Logo or Source icon */}
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {item.companyLogoUrl ? (
                    <img
                      src={item.companyLogoUrl}
                      alt={item.companyName || ""}
                      className="max-w-full max-h-full object-contain p-1"
                    />
                  ) : item.companyName ? (
                    <span className="text-sm font-medium text-slate-500">
                      {item.companyName.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <SourceIcon className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm text-slate-700 dark:text-slate-200 truncate">
                      {item.title}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0",
                        config?.bgColor || defaultIconConfig.bgColor,
                        config?.color || defaultIconConfig.color
                      )}
                    >
                      {config?.label || defaultIconConfig.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {item.subtitle || item.reasoning}
                  </p>
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
                      <DropdownMenuItem onClick={(e) => handleSnooze(e as any, item, "later_today")}>
                        Later today
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleSnooze(e as any, item, "tomorrow")}>
                        Tomorrow
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleSnooze(e as any, item, "next_week")}>
                        Next week
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleSnooze(e as any, item, "custom")}>
                        Custom...
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Resolve */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-500 hover:text-emerald-600"
                    onClick={(e) => handleResolve(e, item)}
                    title="Resolve"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>

                  {/* Create Task (only show for non-task items) */}
                  {item.sourceType !== "task" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                      onClick={(e) => handleCreateTask(e, item)}
                      title="Create task"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Timestamp or event time */}
                <span className="text-[10px] text-slate-400 group-hover:hidden">
                  {item.eventStartAt 
                    ? format(new Date(item.eventStartAt), "h:mm a")
                    : item.dueAt 
                      ? formatDistanceToNow(new Date(item.dueAt), { addSuffix: true })
                      : item.createdAt 
                        ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })
                        : ""
                  }
                </span>
              </div>
            </ActionPanelRow>
          );
        })}
      </ActionPanelListArea>

      <ActionPanelFooter>
        <button 
          onClick={() => navigate('/priority')}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
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
