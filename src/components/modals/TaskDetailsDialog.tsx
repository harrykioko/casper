
import { useEffect } from "react";
import { Edit, Trash } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Task } from "@/components/dashboard/TaskSection";
import { TaskDetailsForm } from "./task-details/TaskDetailsForm";
import { useTaskDetails } from "@/hooks/useTaskDetails";
import { toast } from "@/hooks/use-toast";

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
  const {
    content,
    setContent,
    status,
    setStatus,
    scheduledFor,
    setScheduledFor,
    selectedProject,
    setSelectedProject,
    createUpdatedTask
  } = useTaskDetails({ task });

  const handleSave = () => {
    if (!task) return;
    
    const updatedTask = createUpdatedTask();
    if (!updatedTask) return;
    
    onUpdateTask(updatedTask);
    onOpenChange(false);
    toast({
      title: "Task updated",
      description: "Your task has been successfully updated."
    });
  };

  const handleDelete = () => {
    if (!task) return;
    onDeleteTask(task.id);
    onOpenChange(false);
    toast({
      title: "Task deleted",
      description: "Your task has been successfully deleted.",
      variant: "destructive"
    });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-md mx-auto w-full bg-white/5 backdrop-blur-md rounded-xl p-6 shadow-xl ring-1 ring-white/10 transition-all duration-200 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
      >
        <DialogHeader className="border-b border-white/10 mb-4 pb-3">
          <DialogTitle className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <Edit className="w-4 h-4 text-white/60" /> Edit Task
          </DialogTitle>
        </DialogHeader>

        {task && (
          <TaskDetailsForm
            content={content}
            setContent={setContent}
            status={status}
            setStatus={setStatus}
            scheduledFor={scheduledFor}
            setScheduledFor={setScheduledFor}
            selectedProject={selectedProject}
            setSelectedProject={setSelectedProject}
          />
        )}

        <DialogFooter className="flex justify-between items-center mt-6 pt-3 border-t border-white/10">
          <Button
            variant="ghost"
            onClick={handleDelete}
            className="text-red-500 hover:text-red-600 hover:underline text-sm hover:bg-transparent p-0 h-auto"
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-white/60 hover:text-white text-sm"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium border-white/10"
            >
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
