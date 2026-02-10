import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Mail,
  Calendar,
  ListTodo,
  StickyNote,
  BookOpen,
  Handshake,
  Check,
  Clock,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { addHours, addDays, startOfTomorrow, nextMonday } from "date-fns";
import type { WorkItemSourceType } from "@/hooks/useWorkQueue";
import type { TriageQueueItem } from "@/hooks/useTriageQueue";

interface CommandActionCardProps {
  item: TriageQueueItem;
  index: number;
  onClick: () => void;
  onTrusted: (workItemId: string) => void;
  onNoAction: (workItemId: string) => void;
  onSnooze: (workItemId: string, until: Date) => void;
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

function getScoreTier(score: number) {
  if (score >= 0.7) return "critical";
  if (score >= 0.4) return "medium";
  return "low";
}

export function CommandActionCard({
  item,
  index,
  onClick,
  onTrusted,
  onNoAction,
  onSnooze,
}: CommandActionCardProps) {
  const Icon = SOURCE_ICONS[item.source_type] || Mail;
  const iconColor = SOURCE_COLORS[item.source_type] || "text-muted-foreground";
  const tier = getScoreTier(item.priorityScore);

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025, duration: 0.2 }}
      whileHover={{ y: -1, scale: 1.005 }}
      onClick={onClick}
      className={cn(
        "group w-full text-left px-4 py-3 rounded-xl border border-border/40 bg-card transition-shadow",
        "hover:shadow-sm"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Type icon */}
        <div className="mt-0.5 flex-shrink-0">
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-foreground truncate block">
            {item.one_liner || item.source_title || "Untitled"}
          </span>
          {item.source_snippet && (
            <span className="text-xs text-muted-foreground truncate block mt-0.5">
              {item.source_snippet}
            </span>
          )}
        </div>

        {/* Urgency badge */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {tier === "critical" && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5 font-medium">
              Urgent
            </Badge>
          )}
          {tier === "medium" && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-medium border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400">
              Due
            </Badge>
          )}

          {/* Quick actions - hover revealed */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full"
              onClick={(e) => { e.stopPropagation(); onTrusted(item.id); }}
              title="Mark trusted"
            >
              <Check className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" title="Snooze">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => onSnooze(item.id, addHours(new Date(), 3))}>3 hours</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSnooze(item.id, startOfTomorrow())}>Tomorrow</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSnooze(item.id, nextMonday(new Date()))}>Next week</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSnooze(item.id, addDays(new Date(), 30))}>30 days</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full"
              onClick={(e) => { e.stopPropagation(); onNoAction(item.id); }}
              title="No action"
            >
              <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
