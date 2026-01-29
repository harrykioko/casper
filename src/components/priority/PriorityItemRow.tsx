import {
  AlertTriangle,
  Clock,
  AlertCircle,
  CheckCircle,
  Mail,
  Calendar,
  Flag,
  Star,
  BookOpen,
  CheckSquare,
  MoreHorizontal,
  Folder,
  Phone,
  Plus,
  ExternalLink,
  MessageSquare,
  FileText,
  Building2,
  Handshake,
  HeartCrack,
} from "lucide-react";
import { format, formatDistanceToNow, addHours, addDays, setHours, setMinutes, nextMonday } from "date-fns";
import type { PriorityItem, PriorityIconType, PrioritySourceType } from "@/types/priority";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PriorityItemRowProps {
  item: PriorityItem;
  isSelected?: boolean;
  onClick: () => void;
  onResolve: () => void;
  onSnooze: (duration: "later_today" | "tomorrow" | "next_week" | "custom", customDate?: Date) => void;
  onToggleTopPriority?: (isTop: boolean) => void;
  // New v2 actions
  onCreateTask?: (prefill?: { content?: string; companyId?: string }) => void;
  onLogInteraction?: (companyId: string) => void;
  onViewCompany?: (companyId: string) => void;
  onOpenUrl?: (url: string) => void;
}

// Snooze time helpers
function getSnoozeTime(duration: "later_today" | "tomorrow" | "next_week"): Date {
  const now = new Date();
  switch (duration) {
    case "later_today":
      return addHours(now, 4);
    case "tomorrow":
      return setMinutes(setHours(addDays(now, 1), 9), 0);
    case "next_week":
      return setMinutes(setHours(nextMonday(now), 9), 0);
    default:
      return addHours(now, 4);
  }
}

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
  "commitment": {
    icon: Handshake,
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-100 dark:bg-teal-900/30",
    label: "Commitment",
  },
  "commitment-broken": {
    icon: HeartCrack,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    label: "Overdue Promise",
  },
};

const defaultIconConfig = {
  icon: CheckSquare,
  color: "text-slate-600 dark:text-slate-400",
  bgColor: "bg-slate-100 dark:bg-slate-900/30",
  label: "Task",
};

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
    case "commitment":
      return Handshake;
    case "reading_item":
      return BookOpen;
    case "nonnegotiable":
      return Star;
    default:
      return CheckSquare;
  }
}

export function PriorityItemRow({
  item,
  isSelected,
  onClick,
  onResolve,
  onSnooze,
  onToggleTopPriority,
  onCreateTask,
  onLogInteraction,
  onViewCompany,
  onOpenUrl,
}: PriorityItemRowProps) {
  const config = item.iconType ? iconConfig[item.iconType] : defaultIconConfig;
  const Icon = config?.icon || defaultIconConfig.icon;
  const SourceIcon = getSourceIcon(item.sourceType);

  const canSnooze = item.sourceType === "task" || item.sourceType === "inbox" || item.sourceType === "commitment";
  const canToggleTopPriority = item.sourceType === "task" || item.sourceType === "inbox";
  const isCompany = item.sourceType === "portfolio_company" || item.sourceType === "pipeline_company";
  const isCalendar = item.sourceType === "calendar_event";
  const isReading = item.sourceType === "reading_item";
  const isCommitment = item.sourceType === "commitment";

  return (
    <div
      onClick={onClick}
      className={cn(
        "group flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border",
        isSelected
          ? "bg-accent border-primary/30 ring-1 ring-primary/20"
          : "bg-card hover:bg-accent/50 border-border hover:border-border/80"
      )}
    >
      {/* Status icon */}
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
          config?.bgColor || defaultIconConfig.bgColor
        )}
      >
        <Icon className={cn("w-5 h-5", config?.color || defaultIconConfig.color)} />
      </div>

      {/* Avatar/Logo or Source icon */}
      <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
        {item.companyLogoUrl ? (
          <img
            src={item.companyLogoUrl}
            alt={item.companyName || ""}
            className="max-w-full max-h-full object-contain p-1"
          />
        ) : item.companyName ? (
          <span className="text-sm font-medium text-muted-foreground">
            {item.companyName.charAt(0).toUpperCase()}
          </span>
        ) : (
          <SourceIcon className="w-5 h-5 text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-foreground truncate">
            {item.title}
          </span>
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0",
              config?.bgColor || defaultIconConfig.bgColor,
              config?.color || defaultIconConfig.color
            )}
          >
            {config?.label || defaultIconConfig.label}
          </span>
          {/* Project badge */}
          {item.projectName && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 bg-muted/80 text-muted-foreground border border-border/50"
                  style={item.projectColor ? { 
                    backgroundColor: `${item.projectColor}15`,
                    borderColor: `${item.projectColor}30`,
                    color: item.projectColor
                  } : undefined}
                >
                  <Folder className="w-3 h-3" />
                  <span className="max-w-[80px] truncate">{item.projectName}</span>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Project: {item.projectName}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {item.subtitle || item.reasoning}
        </p>
        {item.contextLabels && item.contextLabels.length > 0 && (
          <div className="flex items-center gap-1.5 mt-1.5">
            {item.contextLabels.map((label) => (
              <span
                key={label}
                className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Timestamp */}
      <div className="flex-shrink-0 text-right">
        <span className="text-xs text-muted-foreground">
          {item.eventStartAt
            ? format(new Date(item.eventStartAt), "MMM d, h:mm a")
            : item.dueAt
              ? formatDistanceToNow(new Date(item.dueAt), { addSuffix: true })
              : item.createdAt
                ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })
                : ""}
        </span>
        <div className="text-[10px] text-muted-foreground/60 mt-0.5">
          Score: {item.priorityScore.toFixed(0)}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {/* Source-specific quick actions */}

        {/* Company actions: Log interaction, Create task */}
        {isCompany && onLogInteraction && item.sourceId && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-sky-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onLogInteraction(item.sourceId);
                  toast.success("Opening interaction log...");
                }}
              >
                <Phone className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Log interaction</TooltipContent>
          </Tooltip>
        )}

        {isCompany && onCreateTask && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-emerald-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateTask({
                    content: `Follow up with ${item.companyName || item.title}`,
                    companyId: item.sourceId,
                  });
                  toast.success("Creating task...");
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Create follow-up task</TooltipContent>
          </Tooltip>
        )}

        {/* Calendar actions: View company context */}
        {isCalendar && item.companyId && onViewCompany && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-violet-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewCompany(item.companyId!);
                }}
              >
                <Building2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">View company</TooltipContent>
          </Tooltip>
        )}

        {isCalendar && onCreateTask && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-emerald-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateTask({
                    content: `Prep for: ${item.title}`,
                  });
                  toast.success("Creating prep task...");
                }}
              >
                <FileText className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Create prep task</TooltipContent>
          </Tooltip>
        )}

        {/* Inbox actions: Create task from email */}
        {item.sourceType === "inbox" && onCreateTask && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-emerald-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateTask({
                    content: `Follow up: ${item.title}`,
                    companyId: item.companyId || undefined,
                  });
                  toast.success("Creating task from email...");
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Create task from email</TooltipContent>
          </Tooltip>
        )}

        {/* Reading list actions: Open URL */}
        {isReading && onOpenUrl && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-rose-600"
                onClick={(e) => {
                  e.stopPropagation();
                  // The sourceId should be the reading item ID, but we need the URL
                  // For now, trigger the onClick which should open the detail
                  onClick();
                }}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Open article</TooltipContent>
          </Tooltip>
        )}

        {/* Commitment actions: View person/company */}
        {isCommitment && item.companyId && onViewCompany && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-teal-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewCompany(item.companyId!);
                }}
              >
                <Building2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">View company</TooltipContent>
          </Tooltip>
        )}

        {isCommitment && onCreateTask && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-emerald-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateTask({
                    content: item.title,
                    companyId: item.companyId || undefined,
                  });
                  toast.success("Creating task from commitment...");
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Create task</TooltipContent>
          </Tooltip>
        )}

        {/* Top Priority Toggle */}
        {canToggleTopPriority && onToggleTopPriority && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8",
                  item.isTopPriority
                    ? "text-amber-500 hover:text-amber-600"
                    : "text-muted-foreground hover:text-amber-500"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleTopPriority(!item.isTopPriority);
                }}
              >
                <Star className={cn("h-4 w-4", item.isTopPriority && "fill-current")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {item.isTopPriority ? "Remove from top priority" : "Make top priority"}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Resolve button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-emerald-600"
              onClick={(e) => {
                e.stopPropagation();
                onResolve();
                toast.success("Item resolved");
              }}
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Mark done</TooltipContent>
        </Tooltip>

        {/* Snooze menu */}
        {canSnooze && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onSnooze("later_today");
                  toast.success("Snoozed until later today");
                }}
              >
                <Clock className="h-4 w-4 mr-2" />
                Later today
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onSnooze("tomorrow");
                  toast.success("Snoozed until tomorrow");
                }}
              >
                <Clock className="h-4 w-4 mr-2" />
                Tomorrow morning
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onSnooze("next_week");
                  toast.success("Snoozed until next week");
                }}
              >
                <Clock className="h-4 w-4 mr-2" />
                Next week
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* Additional actions based on source type */}
              {item.sourceType === "task" && onCreateTask && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    // Duplicate task functionality could go here
                    toast.info("Feature coming soon");
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add note
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Non-snoozeable items get a simple more menu */}
        {!canSnooze && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {isCompany && onLogInteraction && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onLogInteraction(item.sourceId);
                  }}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Log call/meeting
                </DropdownMenuItem>
              )}
              {isCompany && onCreateTask && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateTask({
                      content: `Follow up with ${item.companyName || item.title}`,
                      companyId: item.sourceId,
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create task
                </DropdownMenuItem>
              )}
              {isCalendar && onCreateTask && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateTask({ content: `Notes from: ${item.title}` });
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Add meeting notes
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onResolve();
                }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Dismiss
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Top Priority indicator (always visible when flagged) */}
      {item.isTopPriority && (
        <div className="flex-shrink-0">
          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
        </div>
      )}
    </div>
  );
}
