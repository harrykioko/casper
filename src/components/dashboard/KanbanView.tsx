
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Task } from "@/hooks/useTasks";
import { MoveHorizontal } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { toast } from "@/hooks/use-toast";
import { TaskCardContent } from "@/components/task-cards/TaskCardContent";
import { TaskCardMetadata } from "@/components/task-cards/TaskCardMetadata";
import { cn } from "@/lib/utils";

interface KanbanViewProps { 
  tasks: Task[]; 
  onTaskComplete: (id: string) => void; 
  onTaskDelete: (id: string) => void; 
  onUpdateTaskStatus: (id: string, status: "todo" | "inprogress" | "done") => void;
  onTaskClick: (task: Task) => void;
}

type KanbanColumn = {
  id: "todo" | "inprogress" | "done";
  title: string;
  emptyMessage?: string;
};

export function KanbanView({ tasks, onTaskComplete, onTaskDelete, onUpdateTaskStatus, onTaskClick }: KanbanViewProps) {
  const columns: KanbanColumn[] = [
    { id: "todo", title: "To Do" },
    { id: "inprogress", title: "In Progress" },
    { id: "done", title: "Done", emptyMessage: "Drag a task here to mark it complete" }
  ];

  const getColumnTasks = (columnId: "todo" | "inprogress" | "done") => {
    if (columnId === "todo") {
      return tasks.filter(task => !task.status || task.status === "todo");
    }
    return tasks.filter(task => task.status === columnId);
  };

  const handleDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;

    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

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
                  "flex flex-col rounded-xl p-4 shadow-sm bg-muted/30 backdrop-blur border border-muted/30 space-y-2 relative",
                  snapshot.isDraggingOver ? "ring-2 ring-primary/40" : ""
                )}
                style={{ minHeight: 250 }}
              >
                <h3 className="font-medium mb-3 text-foreground flex items-center gap-1">
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
                            "p-3 rounded-xl shadow-sm bg-muted/30 backdrop-blur border border-muted/30 relative cursor-pointer flex flex-col gap-1",
                            snapshot.isDragging ? "shadow-xl z-50 ring-2 ring-primary/40" : "hover:bg-muted/40 hover:ring-1 hover:ring-muted/50",
                            task.completed && "opacity-60"
                          )}
                          style={{
                            ...provided.draggableProps.style,
                            transform: snapshot.isDragging 
                              ? provided.draggableProps.style?.transform 
                              : "none"
                          }}
                          onClick={() => onTaskClick(task)}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <TaskCardContent 
                              content={task.content} 
                              completed={task.completed}
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                onTaskComplete(task.id);
                              }}
                              className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <span className="sr-only">Toggle completion</span>
                              <div className={cn(
                                "w-4 h-4 rounded-full border-2",
                                task.completed 
                                  ? 'bg-primary border-primary' 
                                  : 'border-muted-foreground hover:border-primary'
                              )} />
                            </Button>
                          </div>
                          
                          <TaskCardMetadata
                            priority={task.priority}
                            project={task.project}
                            scheduledFor={task.scheduledFor}
                            layout="kanban"
                          />
                          
                          <div className="absolute top-2 right-2 cursor-grab opacity-30 hover:opacity-70 transition-opacity">
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
