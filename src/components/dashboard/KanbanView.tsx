
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Task } from "./TaskList";
import { GripVertical } from "lucide-react";

interface KanbanViewProps { 
  tasks: Task[]; 
  onTaskComplete: (id: string) => void; 
  onTaskDelete: (id: string) => void; 
}

export function KanbanView({ tasks, onTaskComplete, onTaskDelete }: KanbanViewProps) {
  // Group tasks by status
  const todoTasks = tasks.filter(task => !task.completed);
  const doneTasks = tasks.filter(task => task.completed);
  const inProgressTasks: Task[] = []; // In a real app, you'd have an in-progress state

  const columns = [
    { title: "To Do", tasks: todoTasks },
    { title: "In Progress", tasks: inProgressTasks },
    { title: "Done", tasks: doneTasks, emptyMessage: "Drag a task here to mark it complete" }
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {columns.map((column) => (
        <div key={column.title} className={cn(
          "flex flex-col glassmorphic rounded-lg p-4",
          column.tasks.length === 0 ? "opacity-80" : ""
        )}>
          <h3 className="font-medium mb-3 text-zinc-800 dark:text-white/90">{column.title}</h3>
          <div className="flex-1 overflow-auto">
            {column.tasks.length > 0 ? (
              <div className="space-y-2">
                {column.tasks.map(task => (
                  <motion.div
                    key={task.id}
                    className="p-3 rounded-xl glassmorphic shadow-lg ring-1 ring-white/10 bg-white/5 backdrop-blur relative"
                    whileHover={{ scale: 1.02 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex">
                      <div className="flex-1">
                        <p className="text-sm text-zinc-800 dark:text-white/90">{task.content}</p>
                        {task.project && (
                          <div className="flex items-center mt-2">
                            <div 
                              className="w-2 h-2 rounded-full mr-1"
                              style={{ backgroundColor: task.project.color }}
                            />
                            <span className="text-xs text-zinc-500 dark:text-white/60">{task.project.name}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onTaskComplete(task.id)}
                          className="h-6 w-6 rounded-full"
                        >
                          <span className="sr-only">Toggle completion</span>
                          <div className={`w-4 h-4 rounded-full border ${task.completed ? 'bg-primary border-primary' : 'border-zinc-400 dark:border-white/60'}`} />
                        </Button>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 cursor-grab opacity-30 hover:opacity-70">
                      <GripVertical className="h-4 w-4" />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 text-sm text-zinc-500 dark:text-white/60">
                {column.emptyMessage || "No tasks"}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper function to conditionally join class names
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
