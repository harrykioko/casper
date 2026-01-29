import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Mail,
  Calendar,
  ListTodo,
  StickyNote,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  Link2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import type { WorkQueueItem, WorkItemSourceType } from "@/hooks/useWorkQueue";

interface WorkQueueListProps {
  items: WorkQueueItem[];
  selectedId: string | null;
  onSelect: (item: WorkQueueItem) => void;
  isLoading: boolean;
  isSystemClear: boolean;
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

export function WorkQueueList({
  items,
  selectedId,
  onSelect,
  isLoading,
  isSystemClear,
}: WorkQueueListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-16 rounded-lg bg-muted/20 animate-pulse" />
        ))}
      </div>
    );
  }

  if (isSystemClear || items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">System Clear</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          All items have been reviewed and processed. New items will appear here as they arrive.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-1.5">
      {items.map((item, index) => {
        const Icon = SOURCE_ICONS[item.source_type] || Mail;
        const iconColor = SOURCE_COLORS[item.source_type] || "text-muted-foreground";
        const isSelected = selectedId === item.id;

        return (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
            onClick={() => onSelect(item)}
            className={cn(
              "w-full text-left px-4 py-3 rounded-lg border transition-all",
              "hover:bg-accent/50",
              isSelected
                ? "bg-accent border-accent-foreground/20 shadow-sm"
                : "bg-muted/10 border-transparent"
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
                <div className="flex items-center gap-2 mt-1.5">
                  {/* Primary link badge */}
                  {item.primary_link && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      <Link2 className="h-2.5 w-2.5 mr-0.5" />
                      {item.primary_link.target_type}
                    </Badge>
                  )}
                  {/* Reason badges */}
                  {item.reason_codes.includes('unlinked_company') && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-400 border-amber-400/30">
                      <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
                      Unlinked
                    </Badge>
                  )}
                  {item.status === 'snoozed' && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-blue-400 border-blue-400/30">
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
      })}
    </div>
  );
}
