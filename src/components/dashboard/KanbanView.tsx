
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Task } from "./TaskSection";
import { GripVertical, MoveHorizontal } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { toast } from "@/hooks/use-toast";

interface KanbanViewProps { 
  tasks: Task[]; 
  onTaskComplete: (id: string) => void; 
  onTaskDelete: (id: string) => void; 
  onUpdateTaskStatus: (id: string, status: "todo" | "inprogress" | "done") => void;
}

type KanbanColumn = {
  id: "todo" | "inprogress" | "done";
  title: string;
  emptyMessage?: string;
};

export function KanbanView({ tasks, onTaskComplete, onTaskDelete, onUpdateTaskStatus }: KanbanViewProps) {
  // Define our columns
  const columns: KanbanColumn[] = [
    { id: "todo", title: "To Do" },
    { id: "inprogress", title: "In Progress" },
    { id: "done", title: "Done", emptyMessage: "Drag a task here to mark it complete" }
  ];

  // Filter tasks for each column based on status
  const getColumnTasks = (columnId: "todo" | "inprogress" | "done") => {
    if (columnId === "todo") {
      return tasks.filter(task => !task.status || task.status === "todo");
    }
    return tasks.filter(task => task.status === columnId);
  };

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

    // Update task status based on destination column
    if (destination.droppableId !== source.droppableId) {
      const newStatus = destination.droppableId as "todo" | "inprogress" | "done";
      onUpdateTaskStatus(task.id, newStatus);
      
      if (newStatus === "done" && !task.completed) {
        toast({
          title: "Task completed",
          description: "Your task has been marked as complete.",
        });
      }
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-3 gap-4 min-h-[400px]">
        {columns.map((column) => (
          <Droppable key={column.id} droppableId={column.id}>
            {(provided, snapshot) => (
              <div 
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  "flex flex-col glassmorphic rounded-lg p-4 space-y-2 relative",
                  snapshot.isDraggingOver ? "ring-2 ring-primary/40" : ""
                )}
                style={{ minHeight: 250 }}
              >
                <h3 className="font-medium mb-3 text-zinc-800 dark:text-white/90 flex items-center gap-1">
                  {column.title}
                </h3>
                
                <div className="flex-1 overflow-visible min-h-[200px] space-y-2">
                  {getColumnTasks(column.id).map((task, index) => (
                    <Draggable 
                      key={task.id} 
                      draggableId={task.id} 
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={cn(
                            "p-3 rounded-xl glassmorphic shadow-lg ring-1 ring-white/10 bg-white/5 backdrop-blur relative",
                            snapshot.isDragging ? "shadow-xl z-50" : ""
                          )}
                          style={{
                            ...provided.draggableProps.style,
                            transform: snapshot.isDragging 
                              ? provided.draggableProps.style?.transform 
                              : "none"
                          }}
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
                            <MoveHorizontal className="h-3 w-3" />
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
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
