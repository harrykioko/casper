import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Mail,
  Calendar,
  ListTodo,
  StickyNote,
  BookOpen,
  AlertCircle,
  Clock,
  Link2,
  Timer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import type { WorkItemSourceType } from "@/hooks/useWorkQueue";
import type { FocusQueueItem } from "@/hooks/useFocusQueue";

interface FocusItemRowProps {
  item: FocusQueueItem;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}

const SOURCE_ICONS: Record<WorkItemSourceType, typeof Mail> = {
  email: Mail,
  calendar_event: Calendar,
  task: ListTodo,
  note: StickyNote,
  reading: BookOpen,
};

const SOURCE_COLORS: Record<WorkItemSourceType, string> = {
  email: "text-blue-400",
  calendar_event: "text-purple-400",
  task: "text-amber-400",
  note: "text-green-400",
  reading: "text-cyan-400",
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

export function FocusItemRow({ item, isSelected, onClick, index }: FocusItemRowProps) {
  const Icon = SOURCE_ICONS[item.source_type] || Mail;
  const iconColor = SOURCE_COLORS[item.source_type] || "text-muted-foreground";
  const scoreTier = getScoreTier(item.priorityScore);
  const borderColor = SCORE_BORDER_COLORS[scoreTier];

  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3 rounded-lg border-l-2 border border-r-transparent border-t-transparent border-b-transparent transition-all",
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
            <span className="text-sm font-medium text-foreground truncate">
              {item.one_liner || item.source_title || "Untitled"}
            </span>
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
