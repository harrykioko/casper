import type { EnrichedTask } from "@/hooks/useEnrichedTasks";
import { TaskGroupedList } from "./TaskGroupedList";

interface TasksMainContentProps {
  regularTasks: EnrichedTask[];
  todayTaskIds?: Set<string>; // Tasks already shown in Today lane
  onTaskComplete: (id: string) => void;
  onTaskDelete: (id: string) => void;
  onUpdateTaskStatus: (id: string, status: "todo" | "inprogress" | "done") => void;
  onUpdateTask: (task: EnrichedTask) => void;
  onTaskClick: (task: EnrichedTask) => void;
  onSnooze: (id: string, until: Date) => void;
  onReschedule: (id: string, date: Date) => void;
  onUpdatePriority: (id: string, priority: string) => void;
  onUpdateEffort: (id: string, minutes: number, category: string) => void;
  onArchive?: (id: string) => void;
}

export function TasksMainContent({
  regularTasks,
  todayTaskIds = new Set(),
  onTaskComplete,
  onTaskDelete,
  onUpdateTaskStatus,
  onUpdateTask,
  onTaskClick,
  onSnooze,
  onReschedule,
  onUpdatePriority,
  onUpdateEffort,
  onArchive,
}: TasksMainContentProps) {
  return (
    <div className="w-full">
      <TaskGroupedList
        tasks={regularTasks}
        excludeIds={todayTaskIds}
        onTaskComplete={onTaskComplete}
        onTaskDelete={onTaskDelete}
        onTaskClick={onTaskClick}
        onSnooze={onSnooze}
        onReschedule={onReschedule}
        onUpdatePriority={onUpdatePriority}
        onUpdateEffort={onUpdateEffort}
        onArchive={onArchive}
      />
    </div>
  );
}
