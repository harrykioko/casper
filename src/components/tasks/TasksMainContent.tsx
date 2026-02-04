import { Task } from "@/hooks/useTasks";
import { TaskGroupedList } from "./TaskGroupedList";

interface TasksMainContentProps {
  regularTasks: Task[];
  onTaskComplete: (id: string) => void;
  onTaskDelete: (id: string) => void;
  onUpdateTaskStatus: (id: string, status: "todo" | "inprogress" | "done") => void;
  onUpdateTask: (task: Task) => void;
  onTaskClick: (task: Task) => void;
}

export function TasksMainContent({ 
  regularTasks, 
  onTaskComplete, 
  onTaskDelete, 
  onUpdateTaskStatus, 
  onUpdateTask,
  onTaskClick
}: TasksMainContentProps) {
  return (
    <div className="w-full">
      <TaskGroupedList
        tasks={regularTasks}
        onTaskComplete={onTaskComplete}
        onTaskDelete={onTaskDelete}
        onTaskClick={onTaskClick}
      />
    </div>
  );
}
