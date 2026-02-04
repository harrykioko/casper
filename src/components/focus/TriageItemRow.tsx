import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Mail,
  Calendar,
  ListTodo,
  StickyNote,
  BookOpen,
  Handshake,
  AlertCircle,
  Clock,
  Link2,
  Timer,
  ExternalLink,
  ListPlus,
  ArrowUpRight,
  Archive,
  Check,
  XCircle,
  Zap,
  Hourglass,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow, addHours, addDays, startOfTomorrow, nextMonday } from "date-fns";
import type { WorkItemSourceType } from "@/hooks/useWorkQueue";
import type { TriageQueueItem } from "@/hooks/useTriageQueue";

interface TriageItemRowProps {
  item: TriageQueueItem;
  isSelected: boolean;
  onClick: () => void;
  index: number;
  // Reading quick action handlers
  onReadingQueue?: (workItemId: string, sourceId: string) => void;
  onReadingUpNext?: (workItemId: string, sourceId: string) => void;
  onReadingArchive?: (workItemId: string, sourceId: string) => void;
  onReadingOpenLink?: (url: string) => void;
  // Email quick action handlers
  onEmailTrusted?: (workItemId: string) => void;
  onEmailNoAction?: (workItemId: string, sourceId: string) => void;
  // Commitment quick action handlers
  onCommitmentComplete?: (workItemId: string, sourceId: string) => void;
  // Shared
  onSnooze?: (workItemId: string, until: Date) => void;
}

const SOURCE_ICONS: Record<WorkItemSourceType, typeof Mail> = {
  email: Mail,
  calendar_event: Calendar,
  task: ListTodo,
  note: StickyNote,
  reading: BookOpen,
  commitment: Handshake,
};

const SOURCE_COLORS: Record<WorkItemSourceType, string> = {
  email: "text-blue-400",
  calendar_event: "text-purple-400",
  task: "text-amber-400",
  note: "text-green-400",
  reading: "text-cyan-400",
  commitment: "text-rose-400",
};

const SCORE_BORDER_COLORS: Record<string, string> = {
  high: "border-l-red-400",
  medium: "border-l-amber-400",
  low: "border-l-emerald-400",
};

function getScoreTier(score: number): string {
  if (score >= 0.7) return "high";
  if (score >= 0.4) return "medium";
  return "low";
}

export function TriageItemRow({
  item,
  isSelected,
  onClick,
  index,
  onReadingQueue,
  onReadingUpNext,
  onReadingArchive,
  onReadingOpenLink,
  onEmailTrusted,
  onEmailNoAction,
  onCommitmentComplete,
  onSnooze,
}: TriageItemRowProps) {
  const Icon = SOURCE_ICONS[item.source_type] || Mail;
  const iconColor = SOURCE_COLORS[item.source_type] || "text-muted-foreground";
  const scoreTier = getScoreTier(item.priorityScore);
  const borderColor = SCORE_BORDER_COLORS[scoreTier];

  const isReading = item.source_type === "reading";
  const isEmail = item.source_type === "email";
  const isCommitment = item.source_type === "commitment";

  const handleOpenLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.source_url && onReadingOpenLink) {
      onReadingOpenLink(item.source_url);
    }
  };

  const handleQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReadingQueue?.(item.id, item.source_id);
  };

  const handleUpNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReadingUpNext?.(item.id, item.source_id);
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReadingArchive?.(item.id, item.source_id);
  };

  const handleSnooze = (until: Date, e: React.MouseEvent) => {
    e.stopPropagation();
    onSnooze?.(item.id, until);
  };

  // Commitment handlers
  const handleCommitmentComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCommitmentComplete?.(item.id, item.source_id);
  };

  // Email handlers
  const handleEmailTrusted = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEmailTrusted?.(item.id);
  };

  const handleEmailNoAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEmailNoAction?.(item.id, item.source_id);
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      onClick={onClick}
      className={cn(
        "group w-full text-left px-4 py-3 rounded-lg border-l-2 border border-r-transparent border-t-transparent border-b-transparent transition-all",
        "hover:bg-accent/50",
        borderColor,
        isSelected
          ? "bg-accent shadow-sm"
          : "bg-muted/10"
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", iconColor)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-foreground truncate flex-1">
              {item.one_liner || item.source_title || "Untitled"}
            </span>
            
            {/* Reading Quick Actions - visible on hover */}
            {isReading && (
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                {item.source_url && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full"
                    onClick={handleOpenLink}
                    title="Open link"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                  onClick={handleQueue}
                  title="Keep in queue"
                >
                  <ListPlus className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                  onClick={handleUpNext}
                  title="Mark as Up Next"
                >
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                  onClick={handleArchive}
                  title="Archive"
                >
                  <Archive className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full"
                      title="Snooze"
                    >
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={(e) => handleSnooze(addHours(new Date(), 3), e as any)}>
                      3 hours
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => handleSnooze(startOfTomorrow(), e as any)}>
                      Tomorrow
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => handleSnooze(nextMonday(new Date()), e as any)}>
                      Next week
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => handleSnooze(addDays(new Date(), 30), e as any)}>
                      30 days
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Email Quick Actions - visible on hover */}
            {isEmail && (
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                  onClick={handleEmailTrusted}
                  title="Mark trusted"
                >
                  <Check className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full"
                      title="Snooze"
                    >
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={(e) => handleSnooze(addHours(new Date(), 3), e as any)}>
                      3 hours
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => handleSnooze(startOfTomorrow(), e as any)}>
                      Tomorrow
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => handleSnooze(nextMonday(new Date()), e as any)}>
                      Next week
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => handleSnooze(addDays(new Date(), 30), e as any)}>
                      30 days
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                  onClick={handleEmailNoAction}
                  title="No action (removes from inbox)"
                >
                  <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            )}

            {/* Commitment Quick Actions - visible on hover */}
            {isCommitment && (
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                  onClick={handleCommitmentComplete}
                  title="Mark complete"
                >
                  <Check className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full"
                      title="Snooze"
                    >
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={(e) => handleSnooze(addHours(new Date(), 3), e as any)}>
                      3 hours
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => handleSnooze(startOfTomorrow(), e as any)}>
                      Tomorrow
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => handleSnooze(nextMonday(new Date()), e as any)}>
                      Next week
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => handleSnooze(addDays(new Date(), 30), e as any)}>
                      30 days
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
          {item.source_snippet && (
            <p className="text-xs text-muted-foreground truncate">
              {item.source_snippet}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {/* Primary link badge */}
            {item.primary_link && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                <Link2 className="h-2.5 w-2.5 mr-0.5" />
                {item.primary_link.target_type}
              </Badge>
            )}
            {/* Reason badges */}
            {item.reason_codes.includes("unlinked_company") && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 text-amber-400 border-amber-400/30"
              >
                <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
                Unlinked
              </Badge>
            )}
            {item.reason_codes.includes("stale") && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 text-orange-400 border-orange-400/30"
              >
                <Timer className="h-2.5 w-2.5 mr-0.5" />
                Stale
              </Badge>
            )}
            {item.reason_codes.includes("no_next_action") && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 text-rose-400 border-rose-400/30"
              >
                <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
                No action
              </Badge>
            )}
            {item.status === "snoozed" && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 text-blue-400 border-blue-400/30"
              >
                <Clock className="h-2.5 w-2.5 mr-0.5" />
                Snoozed
              </Badge>
            )}
            {/* Effort badge */}
            {item.effortEstimate === 'quick' && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 text-emerald-400 border-emerald-400/30"
              >
                <Zap className="h-2.5 w-2.5 mr-0.5" />
                ~5m
              </Badge>
            )}
            {item.effortEstimate === 'medium' && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 text-amber-400 border-amber-400/30"
              >
                <Timer className="h-2.5 w-2.5 mr-0.5" />
                ~15m
              </Badge>
            )}
            {item.effortEstimate === 'long' && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 text-rose-400 border-rose-400/30"
              >
                <Hourglass className="h-2.5 w-2.5 mr-0.5" />
                30m+
              </Badge>
            )}
            {/* Timestamp */}
            <span className="text-[10px] text-muted-foreground ml-auto">
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
