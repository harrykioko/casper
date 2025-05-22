
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Task } from "./TaskList";
import { GripVertical, MoveHorizontal } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface KanbanViewProps { 
  tasks: Task[]; 
  onTaskComplete: (id: string) => void; 
  onTaskDelete: (id: string) => void; 
}

type KanbanColumn = {
  id: string;
  title: string;
  tasks: Task[];
  emptyMessage?: string;
}

export function KanbanView({ tasks, onTaskComplete, onTaskDelete }: KanbanViewProps) {
  // Group tasks by status
  const todoTasks = tasks.filter(task => !task.completed);
  const doneTasks = tasks.filter(task => task.completed);
  const inProgressTasks: Task[] = []; // In a real app, you'd have an in-progress state

  // Set up columns for drag and drop
  const [columns, setColumns] = useState<KanbanColumn[]>([
    { id: "todo", title: "To Do", tasks: todoTasks },
    { id: "inprogress", title: "In Progress", tasks: inProgressTasks },
    { id: "done", title: "Done", tasks: doneTasks, emptyMessage: "Drag a task here to mark it complete" }
  ]);

  // Handle drag end event
  const handleDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;

    // Return if dropped outside a valid droppable area
    if (!destination) return;
    
    // Return if dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;

    // Find the task being moved
    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

    // Create a new array of columns
    const newColumns = [...columns];
    
    // Remove from source column
    const sourceColumn = newColumns.find(col => col.id === source.droppableId);
    if (!sourceColumn) return;
    
    sourceColumn.tasks = sourceColumn.tasks.filter(t => t.id !== draggableId);
    
    // Add to destination column
    const destColumn = newColumns.find(col => col.id === destination.droppableId);
    if (!destColumn) return;
    
    // Create a copy of the task to avoid mutating the original
    const updatedTask = {...task};

    // Update task status based on destination column
    if (destColumn.id === "done" && !updatedTask.completed) {
      updatedTask.completed = true;
      onTaskComplete(updatedTask.id);
      toast({
        title: "Task completed",
        description: "Your task has been marked as complete.",
      });
    } else if (destColumn.id !== "done" && updatedTask.completed) {
      updatedTask.completed = false;
      onTaskComplete(updatedTask.id);
    }
    
    // Insert task at destination position
    const destTasks = Array.from(destColumn.tasks);
    destTasks.splice(destination.index, 0, updatedTask);
    destColumn.tasks = destTasks;
    
    // Update columns state
    setColumns(newColumns);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-3 gap-4">
        {columns.map((column) => (
          <Droppable key={column.id} droppableId={column.id}>
            {(provided, snapshot) => (
              <div 
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  "flex flex-col glassmorphic rounded-lg p-4",
                  column.tasks.length === 0 ? "opacity-80" : "",
                  snapshot.isDraggingOver ? "ring-2 ring-primary/40" : ""
                )}
              >
                <h3 className="font-medium mb-3 text-zinc-800 dark:text-white/90 flex items-center gap-1">
                  {column.title}
                </h3>
                <div className="flex-1 overflow-auto min-h-[200px]">
                  {column.tasks.length > 0 ? (
                    <div className="space-y-2">
                      {column.tasks.map((task, index) => (
                        <Draggable 
                          key={task.id} 
                          draggableId={task.id} 
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <motion.div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={cn(
                                "p-3 rounded-xl glassmorphic shadow-lg ring-1 ring-white/10 bg-white/5 backdrop-blur relative",
                                snapshot.isDragging ? "opacity-90 scale-105" : ""
                              )}
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
                              <div 
                                {...provided.dragHandleProps}
                                className="absolute top-2 right-2 cursor-grab opacity-30 hover:opacity-70 flex items-center gap-1"
                              >
                                <MoveHorizontal className="h-3 w-3" />
                                <GripVertical className="h-4 w-4" />
                              </div>
                            </motion.div>
                          )}
                        </Draggable>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-4 text-sm text-zinc-500 dark:text-white/60">
                      {column.emptyMessage || "No tasks"}
                    </div>
                  )}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}

// Helper function to conditionally join class names
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
