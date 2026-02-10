import { motion } from "framer-motion";
import { FocusUpNextRow } from "./FocusUpNextRow";
import { EnrichedTask } from "@/hooks/useEnrichedTasks";
import { Commitment } from "@/types/commitment";

interface UpNextItem {
  id: string;
  title: string;
  type: "task" | "commitment";
  scheduledFor?: string;
  personName?: string;
  completed?: boolean;
}

interface FocusUpNextProps {
  tasks: EnrichedTask[];
  commitments: Commitment[];
  onToggleTask: (id: string) => void;
  onClickItem: (id: string, type: "task" | "commitment") => void;
}

export function FocusUpNext({
  tasks,
  commitments,
  onToggleTask,
  onClickItem,
}: FocusUpNextProps) {
  // Build unified list: tasks + open commitments, max 5
  const items: UpNextItem[] = [
    ...tasks.map((t) => ({
      id: t.id,
      title: t.content,
      type: "task" as const,
      scheduledFor: t.scheduledFor,
      completed: t.completed,
    })),
    ...commitments
      .filter((c) => c.status === "open")
      .map((c) => ({
        id: c.id,
        title: c.title || c.content,
        type: "commitment" as const,
        scheduledFor: c.dueAt,
        personName: c.personName,
      })),
  ].slice(0, 5);

  const taskCount = items.filter((i) => i.type === "task").length;
  const commitmentCount = items.filter((i) => i.type === "commitment").length;

  return (
    <motion.div
      className="mt-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.25 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
          Up Next
        </h3>
        <span className="text-[11px] text-muted-foreground/70">
          {taskCount > 0 && `${taskCount} Task${taskCount !== 1 ? "s" : ""}`}
          {taskCount > 0 && commitmentCount > 0 && " · "}
          {commitmentCount > 0 &&
            `${commitmentCount} Commitment${commitmentCount !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 px-3 py-4">
          Nothing queued — you're clear.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <FocusUpNextRow
              key={item.id}
              id={item.id}
              title={item.title}
              type={item.type}
              scheduledFor={item.scheduledFor}
              personName={item.personName}
              completed={item.completed}
              onToggle={onToggleTask}
              onClick={(id) => onClickItem(id, item.type)}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
