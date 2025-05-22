
import { useState, useEffect } from "react";
import { Check, Calendar, Trash, X, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Task } from "@/components/dashboard/TaskSection";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
  useEffect(() => {
    if (task) {
      setContent(task.content);
      setStatus(task.status || "todo");
      setSelectedProject(task.project);
      
      // Only try to parse the date if it's a valid date string format
      if (task.scheduledFor) {
        try {
          // Try to parse the date - this will fail for strings like "Today", "Tomorrow"
          const date = new Date(task.scheduledFor);
          
          // Check if the date is valid
          if (!isNaN(date.getTime())) {
            setScheduledFor(date);
          } else {
            setScheduledFor(undefined);
          }
        } catch (error) {
          console.error("Error parsing date:", error);
          setScheduledFor(undefined);
        }
      } else {
        setScheduledFor(undefined);
      }
    }
  }, [task]);

  const handleSave = () => {
    if (!task) return;
    
    const updatedTask: Task = {
      ...task,
      content,
      status,
      completed: status === "done",
      project: selectedProject,
      // Only save the date if it's valid
      scheduledFor: scheduledFor ? scheduledFor.toISOString() : undefined
    };
    
    onUpdateTask(updatedTask);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!task) return;
    onDeleteTask(task.id);
    onOpenChange(false);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (open) {
        if (e.key === "Escape") {
          onOpenChange(false);
        } else if ((e.metaKey || e.ctrlKey) && e.key === "s") {
          e.preventDefault();
          handleSave();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange, handleSave]);

  // Mock projects - in a real app, these would come from a projects store
  const mockProjects = [
    { id: "1", name: "Personal", color: "#FF6B6B" },
    { id: "2", name: "Work", color: "#4ECDC4" },
    { id: "3", name: "Learning", color: "#9D65C9" }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glassmorphic bg-white/5 backdrop-blur-md rounded-xl p-6 shadow-xl ring-1 ring-white/10 animate-fade-in">
        <DialogHeader className="border-b border-white/10 mb-4 pb-3">
          <DialogTitle className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <Edit className="h-4 w-4" /> Edit Task
          </DialogTitle>
        </DialogHeader>

        {task && (
          <div className="space-y-4 py-2">
            {/* Task Content */}
            <div className="space-y-2">
              <label htmlFor="task-content" className="text-sm font-medium block">
                Task
              </label>
              <Textarea
                id="task-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[80px] resize-none w-full bg-white/5 border border-white/10 rounded-md text-sm px-3 py-2 placeholder-white/40 focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:ring-offset-0 focus-visible:outline-none"
              />
            </div>

            {/* Project Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium block">Project</label>
              <div className="flex flex-wrap gap-2">
                {mockProjects.map((project) => (
                  <Button
                    key={project.id}
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-8 px-3 text-sm rounded-full",
                      selectedProject?.id === project.id
                        ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white border-transparent"
                        : "bg-white/5 hover:bg-white/15 border border-white/10"
                    )}
                    onClick={() => setSelectedProject(project)}
                    style={selectedProject?.id !== project.id ? {} : undefined}
                  >
                    <div 
                      className="w-2 h-2 rounded-full mr-1.5 inline-block"
                      style={{backgroundColor: project.color}}
                    />
                    {project.name}
                  </Button>
                ))}
                {selectedProject && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-white/5 hover:bg-white/10 rounded-full"
                    onClick={() => setSelectedProject(undefined)}
                  >
                    <X className="h-3.5 w-3.5" />
                    <span className="sr-only">Clear selection</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Due Date Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium block">Due Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left relative pl-10 bg-white/5 border border-white/10 hover:bg-white/10 rounded-md text-sm py-2",
                      !scheduledFor && "text-white/40"
                    )}
                  >
                    <Calendar className="absolute left-3 top-2 h-4 w-4 text-white/40" />
                    {scheduledFor ? format(scheduledFor, "PPP") : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white/10 backdrop-blur-md border border-white/10" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={scheduledFor}
                    onSelect={setScheduledFor}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {/* Add option to clear the date */}
              {scheduledFor && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-white/60 hover:text-white"
                  onClick={() => setScheduledFor(undefined)}
                >
                  Clear date
                </Button>
              )}
            </div>

            {/* Status Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium block">Status</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-8 px-3 rounded-full text-sm font-medium",
                    status === "todo" 
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-inner border-transparent" 
                      : "bg-white/5 hover:bg-white/15 border border-white/10"
                  )}
                  onClick={() => setStatus("todo")}
                >
                  To Do
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-8 px-3 rounded-full text-sm font-medium",
                    status === "inprogress" 
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-inner border-transparent" 
                      : "bg-white/5 hover:bg-white/15 border border-white/10"
                  )}
                  onClick={() => setStatus("inprogress")}
                >
                  In Progress
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-8 px-3 rounded-full text-sm font-medium",
                    status === "done" 
                      ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-inner border-transparent" 
                      : "bg-white/5 hover:bg-white/15 border border-white/10"
                  )}
                  onClick={() => setStatus("done")}
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="sm:justify-between gap-2 mt-4 pt-2">
          <Button
            variant="ghost"
            onClick={handleDelete}
            className="text-red-500 hover:text-red-600 hover:underline text-sm hover:bg-transparent"
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-white/70 hover:text-white text-sm hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button 
              variant="outline"
              className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium border-white/10"
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
