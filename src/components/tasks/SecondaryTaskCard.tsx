import { motion } from "framer-motion";
import { ArrowRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EnrichedTask } from "@/hooks/useEnrichedTasks";
import { EntityPill } from "./EntityPill";
import { format, parseISO, isToday, isTomorrow, isPast } from "date-fns";

interface SecondaryTaskCardProps {
  task: EnrichedTask;
  onClick: (task: EnrichedTask) => void;
}

function formatRelativeDate(dateString?: string): string {
  if (!dateString) return "";
  const date = parseISO(dateString);
  const now = new Date();
  
  if (isPast(date) && !isToday(date)) return "Overdue";
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEEE");
}

export function SecondaryTaskCard({ task, onClick }: SecondaryTaskCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, delay: 0.05 }}
      onClick={() => onClick(task)}
      className={cn(
        "w-64 rounded-xl p-4 cursor-pointer flex-shrink-0",
        "bg-card",
        "border border-border",
        "hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200"
      )}
    >
      {/* Entity pill at top */}
      {task.linkedEntity && (
        <EntityPill entity={task.linkedEntity} size="sm" />
      )}

      {/* Title - medium size */}
      <h4 className={cn(
        "text-sm font-medium text-foreground line-clamp-2 leading-snug",
        task.linkedEntity ? "mt-2" : ""
      )}>
        {task.content}
      </h4>

      {/* Due date */}
      {task.scheduledFor && (
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Due {formatRelativeDate(task.scheduledFor)}
        </p>
      )}

      {/* Start working link */}
      <div className="flex justify-between items-center mt-3 pt-2 border-t border-border/50">
        <span className="text-xs text-muted-foreground">Start working</span>
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
      </div>
    </motion.div>
  );
}
