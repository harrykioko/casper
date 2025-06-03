
import { useEffect } from "react";
import { Edit, Trash } from "lucide-react";
import { GlassModal, GlassModalContent, GlassModalHeader, GlassModalTitle, GlassModalFooter } from "@/components/ui/GlassModal";
import { Button } from "@/components/ui/button";
import { Task } from "@/hooks/useTasks";
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
    <GlassModal open={open} onOpenChange={onOpenChange}>
      <GlassModalContent className="max-w-lg">
        <GlassModalHeader className="border-b border-muted/20 mb-4 pb-3">
          <GlassModalTitle className="flex items-center gap-2">
            <Edit className="w-4 h-4 text-muted-foreground" /> Edit Task
          </GlassModalTitle>
        </GlassModalHeader>

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

        <div className="flex justify-between items-center mt-6 pt-3 border-t border-muted/20">
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="flex items-center gap-2"
          >
            <Trash className="h-4 w-4" />
            Delete
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </GlassModalContent>
    </GlassModal>
  );
}
