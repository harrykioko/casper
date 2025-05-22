
import { useState } from "react";
import { Check, Calendar, Trash, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Task } from "@/components/dashboard/TaskSection";
import { cn } from "@/lib/utils";

interface TaskDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

export function TaskDetailsDialog({ 
  open, 
  onOpenChange, 
  task, 
  onUpdateTask, 
  onDeleteTask 
}: TaskDetailsDialogProps) {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"todo" | "inprogress" | "done">("todo");
  const [scheduledFor, setScheduledFor] = useState<Date | undefined>(undefined);
  const [selectedProject, setSelectedProject] = useState<Task["project"] | undefined>(undefined);
  
  // Initialize form when task changes
  useState(() => {
    if (task) {
      setContent(task.content);
      setStatus(task.status || "todo");
      setSelectedProject(task.project);
      setScheduledFor(task.scheduledFor ? new Date(task.scheduledFor) : undefined);
    }
  });

  const handleSave = () => {
    if (!task) return;
    
    const updatedTask: Task = {
      ...task,
      content,
      status,
      completed: status === "done",
      project: selectedProject,
      scheduledFor: scheduledFor ? format(scheduledFor, "PPP") : undefined
    };
    
    onUpdateTask(updatedTask);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!task) return;
    onDeleteTask(task.id);
    onOpenChange(false);
  };

  // Mock projects - in a real app, these would come from a projects store
  const mockProjects = [
    { id: "1", name: "Personal", color: "#FF6B6B" },
    { id: "2", name: "Work", color: "#4ECDC4" },
    { id: "3", name: "Learning", color: "#9D65C9" }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glassmorphic backdrop-blur-md bg-white/10 dark:bg-gray-900/30 rounded-xl p-6 shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="h-4 w-4" /> Edit Task
          </DialogTitle>
        </DialogHeader>

        {task && (
          <div className="space-y-4 py-2">
            {/* Task Content */}
            <div className="space-y-2">
              <label htmlFor="task-content" className="text-sm font-medium">
                Task
              </label>
              <Textarea
                id="task-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[80px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0 border-gray-300 dark:border-gray-700"
              />
            </div>

            {/* Project Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Project</label>
              <div className="flex flex-wrap gap-2">
                {mockProjects.map((project) => (
                  <Button
                    key={project.id}
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-8 px-3 border-2",
                      selectedProject?.id === project.id
                        ? "border-primary"
                        : "border-transparent"
                    )}
                    onClick={() => setSelectedProject(project)}
                    style={{
                      backgroundColor: `${project.color}20`, // 20% opacity
                      color: project.color,
                    }}
                  >
                    {project.name}
                  </Button>
                ))}
                {selectedProject && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setSelectedProject(undefined)}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Clear selection</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Due Date Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !scheduledFor && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {scheduledFor ? format(scheduledFor, "PPP") : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={scheduledFor}
                    onSelect={setScheduledFor}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Status Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-8 px-3",
                    status === "todo" ? "bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800" : ""
                  )}
                  onClick={() => setStatus("todo")}
                >
                  To Do
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-8 px-3",
                    status === "inprogress" ? "bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800" : ""
                  )}
                  onClick={() => setStatus("inprogress")}
                >
                  In Progress
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-8 px-3",
                    status === "done" ? "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800" : ""
                  )}
                  onClick={() => setStatus("done")}
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="sm:justify-between gap-2">
          <Button
            variant="ghost"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="outline"
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white border-gray-300 dark:border-gray-700"
              onClick={handleSave}
            >
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
