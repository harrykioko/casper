/**
 * CommitmentCard Component
 *
 * Displays a single commitment with status, due date, and actions.
 */

import { useState } from "react";
import { format, parseISO, isPast, isToday, differenceInDays } from "date-fns";
import {
  Check,
  Clock,
  MoreHorizontal,
  User,
  Building2,
  AlertTriangle,
  Handshake,
  Forward,
  X,
  ArrowRight,
  ArrowLeft,
  Hourglass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Commitment } from "@/types/commitment";

interface CommitmentCardProps {
  commitment: Commitment;
  onComplete?: (id: string) => void;
  onSnooze?: (id: string) => void;
  onDelegate?: (id: string) => void;
  onCancel?: (id: string) => void;
  onClick?: (commitment: Commitment) => void;
  compact?: boolean;
}

export function CommitmentCard({
  commitment,
  onComplete,
  onSnooze,
  onDelegate,
  onCancel,
  onClick,
  compact = false,
}: CommitmentCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const isOverdue = commitment.dueAt
    ? isPast(parseISO(commitment.dueAt)) && !isToday(parseISO(commitment.dueAt))
    : false;
  const isDueToday = commitment.dueAt
    ? isToday(parseISO(commitment.dueAt))
    : false;
  const isDueSoon = commitment.dueAt && !isOverdue && !isDueToday
    ? differenceInDays(parseISO(commitment.dueAt), new Date()) <= 3
    : false;

  const getStatusColor = () => {
    if (isOverdue) return "border-red-500 bg-red-500/5";
    if (isDueToday) return "border-orange-500 bg-orange-500/5";
    if (isDueSoon) return "border-yellow-500 bg-yellow-500/5";
    if (commitment.direction === "owed_by_me") return "border-l-amber-400 border-muted/30";
    if (commitment.direction === "owed_to_me") return "border-l-blue-400 border-muted/30";
    return "border-muted/30";
  };

  const getDirectionBadge = () => {
    if (commitment.direction === "owed_to_me") {
      return (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-blue-400 border-blue-400/30">
          <ArrowLeft className="h-2.5 w-2.5 mr-0.5" />
          Owed to me
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-400 border-amber-400/30">
        <ArrowRight className="h-2.5 w-2.5 mr-0.5" />
        I owe
      </Badge>
    );
  };

  const getUrgencyBadge = () => {
    if (isOverdue) {
      const days = Math.abs(differenceInDays(new Date(), parseISO(commitment.dueAt!)));
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {days}d overdue
        </Badge>
      );
    }
    if (isDueToday) {
      return (
        <Badge className="bg-orange-500 text-white text-xs">
          Due today
        </Badge>
      );
    }
    if (isDueSoon) {
      const days = differenceInDays(parseISO(commitment.dueAt!), new Date());
      return (
        <Badge variant="secondary" className="text-xs">
          Due in {days}d
        </Badge>
      );
    }
    if (commitment.impliedUrgency) {
      return (
        <Badge variant="outline" className="text-xs">
          {formatUrgency(commitment.impliedUrgency)}
        </Badge>
      );
    }
    return null;
  };

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComplete?.(commitment.id);
  };

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-2 rounded-lg border transition-all cursor-pointer hover:bg-muted/40",
          getStatusColor()
        )}
        onClick={() => onClick?.(commitment)}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  "h-6 w-6 rounded-full flex-shrink-0",
                  isOverdue ? "text-red-500" : "text-muted-foreground"
                )}
                onClick={handleComplete}
              >
                <Handshake className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Mark as complete</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="flex-1 min-w-0">
          <p className="text-sm truncate">{commitment.title || commitment.content}</p>
          {commitment.personName && (
            <p className="text-xs text-muted-foreground truncate">
              {commitment.direction === "owed_to_me" ? "From" : "To"}: {commitment.personName}
            </p>
          )}
        </div>

        {getDirectionBadge()}
        {commitment.status === "waiting_on" && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-cyan-400 border-cyan-400/30">
            <Hourglass className="h-2.5 w-2.5 mr-0.5" />
            Waiting
          </Badge>
        )}
        {getUrgencyBadge()}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-start rounded-xl p-4 shadow-sm backdrop-blur border transition-all duration-200 cursor-pointer",
        getStatusColor(),
        "hover:ring-1 hover:ring-muted/50"
      )}
      onClick={() => onClick?.(commitment)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Complete button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className={cn(
                "rounded-full h-8 w-8 mr-3 flex-shrink-0 border-2",
                isOverdue ? "border-red-500 text-red-500" : "border-primary/50"
              )}
              onClick={handleComplete}
            >
              <Check className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Mark as fulfilled</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {commitment.title && (
              <p className={cn(
                "font-medium",
                isOverdue && "text-red-600 dark:text-red-400"
              )}>
                {commitment.title}
              </p>
            )}
            <p className={cn(
              commitment.title ? "text-sm text-muted-foreground" : "font-medium",
              isOverdue && !commitment.title && "text-red-600 dark:text-red-400"
            )}>
              {commitment.content}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {getDirectionBadge()}
            {commitment.status === "waiting_on" && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-cyan-400 border-cyan-400/30">
                <Hourglass className="h-2.5 w-2.5 mr-0.5" />
                Waiting
              </Badge>
            )}
            {getUrgencyBadge()}
          </div>
        </div>

        {/* Context */}
        {commitment.context && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {commitment.context}
          </p>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
          {commitment.personName && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {commitment.personName}
            </span>
          )}
          {commitment.companyName && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {commitment.companyName}
            </span>
          )}
          {(commitment.dueAt || commitment.expectedBy) && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {commitment.direction === "owed_to_me" && commitment.expectedBy
                ? `Expected ${format(parseISO(commitment.expectedBy), "MMM d")}`
                : commitment.dueAt
                ? `Due ${format(parseISO(commitment.dueAt), "MMM d")}`
                : null
              }
            </span>
          )}
          {commitment.sourceType !== "manual" && (
            <Badge variant="outline" className="text-xs py-0">
              From {commitment.sourceType}
            </Badge>
          )}
          {commitment.snoozeCount > 0 && (
            <Badge variant="secondary" className="text-xs py-0">
              Snoozed {commitment.snoozeCount}x
            </Badge>
          )}
        </div>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              "h-8 w-8 rounded-full flex-shrink-0",
              isHovered ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onComplete?.(commitment.id)}>
            <Check className="h-4 w-4 mr-2" />
            Mark as complete
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSnooze?.(commitment.id)}>
            <Clock className="h-4 w-4 mr-2" />
            Snooze
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelegate?.(commitment.id)}>
            <Forward className="h-4 w-4 mr-2" />
            Delegate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onCancel?.(commitment.id)}
            className="text-red-600"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function formatUrgency(urgency: string): string {
  switch (urgency) {
    case "asap": return "ASAP";
    case "today": return "Today";
    case "this_week": return "This week";
    case "next_week": return "Next week";
    case "this_month": return "This month";
    case "when_possible": return "When possible";
    default: return urgency;
  }
}
