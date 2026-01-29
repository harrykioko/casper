import { Droppable, Draggable } from "react-beautiful-dnd";
import { Task } from "@/hooks/useTasks";
import { TaskCardContent } from "@/components/task-cards/TaskCardContent";
import { TaskCardMetadata } from "@/components/task-cards/TaskCardMetadata";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MoveHorizontal } from "lucide-react";

interface InboxColumnProps {
  tasks: Task[];
  onTaskComplete: (id: string) => void;
  onTaskClick: (task: Task) => void;
}

export function InboxColumn({ tasks, onTaskComplete, onTaskClick }: InboxColumnProps) {
  return (
    <Droppable droppableId="inbox">
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
            Triage
            <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-full">
              {tasks.length}
            </span>
          </h3>
          
          <div className="flex-1 overflow-visible min-h-[300px] space-y-3">
            {tasks.map((task, index) => (
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
            
            {tasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-muted/30 flex items-center justify-center mb-3">
                  <div className="text-xl">🎯</div>
                </div>
                <p className="text-sm text-muted-foreground">
                  All clear! No tasks to triage.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </Droppable>
  );
}