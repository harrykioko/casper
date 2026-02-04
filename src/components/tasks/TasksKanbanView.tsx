
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Task } from "@/hooks/useTasks";
import { MoveHorizontal } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { toast } from "@/hooks/use-toast";
import { TaskCardContent } from "@/components/task-cards/TaskCardContent";
import { TaskCardMetadata } from "@/components/task-cards/TaskCardMetadata";
import { cn } from "@/lib/utils";
import { InboxColumn } from "./kanban/InboxColumn";

interface TasksKanbanViewProps { 
  tasks: Task[]; 
  inboxTasks: Task[];
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

export function TasksKanbanView({ tasks, inboxTasks, onTaskComplete, onTaskDelete, onUpdateTaskStatus, onTaskClick }: TasksKanbanViewProps) {
  const columns: KanbanColumn[] = [
    { id: "todo", title: "Ready" },
    { id: "inprogress", title: "Doing" },
    { id: "done", title: "Done Today", emptyMessage: "Drag a task here to mark it complete" }
  ];

  const getColumnTasks = (columnId: "todo" | "inprogress" | "done") => {
    // Exclude inbox tasks from regular columns
    const nonInboxTasks = tasks.filter(task => !task.inbox);
    if (columnId === "todo") {
      return nonInboxTasks.filter(task => !task.status || task.status === "todo");
    }
    return nonInboxTasks.filter(task => task.status === columnId);
  };

  const handleDragEnd = (result: { destination: { droppableId: string; index: number } | null; source: { droppableId: string; index: number }; draggableId: string }) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;

    // Find task in either inbox or regular tasks
    const task = [...inboxTasks, ...tasks].find(t => t.id === draggableId);
    if (!task) return;

    if (destination.droppableId !== source.droppableId) {
      // Moving from inbox to a workflow column
      if (source.droppableId === "inbox" && destination.droppableId !== "inbox") {
        const newStatus = destination.droppableId as "todo" | "inprogress" | "done";
        onUpdateTaskStatus(task.id, newStatus);
        // DB trigger will set inbox = false automatically
        
        toast({
          title: "Task promoted",
          description: "Task moved out of triage.",
        });
      }
      // Moving between workflow columns
      else if (source.droppableId !== "inbox" && destination.droppableId !== "inbox") {
        const newStatus = destination.droppableId as "todo" | "inprogress" | "done";
        onUpdateTaskStatus(task.id, newStatus);
        
        if (newStatus === "done" && !task.completed) {
          toast({
            title: "Task completed",
            description: "Your task has been marked as complete.",
          });
        }
      }
      // Note: We don't allow dragging back to inbox
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-4 gap-6 min-h-[500px]">
        {/* Triage Column */}
        <InboxColumn
          tasks={inboxTasks}
          onTaskComplete={onTaskComplete}
          onTaskClick={onTaskClick}
        />
        
        {/* Regular Workflow Columns */}
        {columns.map((column) => (
          <Droppable key={column.id} droppableId={column.id}>
            {(provided, snapshot) => (
              <div 
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  "flex flex-col rounded-xl p-4 shadow-sm bg-muted/30 backdrop-blur border border-muted/30 space-y-3 relative",
                  snapshot.isDraggingOver ? "ring-2 ring-primary/40" : ""
                )}
                style={{ minHeight: 400 }}
              >
                <h3 className="font-medium text-foreground flex items-center gap-2 pb-2 border-b border-muted/20">
                  {column.title}
                  <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-full">
                    {getColumnTasks(column.id).length}
                  </span>
                </h3>
                
                <div className="flex-1 overflow-visible min-h-[300px] space-y-3">
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
                            "group p-4 rounded-xl shadow-sm bg-background/80 backdrop-blur border border-muted/30 relative cursor-pointer flex flex-col gap-2",
                            snapshot.isDragging ? "shadow-xl z-50 ring-2 ring-primary/40" : "hover:bg-background/90 hover:ring-1 hover:ring-muted/50",
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
                          
                          <div className="absolute top-2 right-2 cursor-grab opacity-20 group-hover:opacity-60 transition-opacity">
                            <MoveHorizontal className="h-3 w-3" />
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  
                  {getColumnTasks(column.id).length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-12 h-12 rounded-xl bg-muted/30 flex items-center justify-center mb-3">
                        <div className="grid grid-cols-2 gap-1">
                          <div className="w-1.5 h-1.5 rounded-sm bg-muted-foreground/40"></div>
                          <div className="w-1.5 h-1.5 rounded-sm bg-muted-foreground/40"></div>
                          <div className="w-1.5 h-1.5 rounded-sm bg-muted-foreground/40"></div>
                          <div className="w-1.5 h-1.5 rounded-sm bg-muted-foreground/40"></div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {column.emptyMessage || `No ${column.title.toLowerCase()} tasks`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
