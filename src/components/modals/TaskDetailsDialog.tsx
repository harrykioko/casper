
import { useEffect } from "react";
import { Edit, Trash } from "lucide-react";
import { GlassModal, GlassModalContent, GlassModalHeader, GlassModalTitle } from "@/components/ui/GlassModal";
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
    priority,
    setPriority,
    category,
    setCategory,
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
      <GlassModalContent className="w-full max-w-lg bg-muted/30 backdrop-blur-md rounded-xl shadow-xl p-6">
        <GlassModalHeader className="mb-6">
          <GlassModalTitle className="flex items-center gap-2 text-xl font-semibold">
            <Edit className="w-5 h-5 text-muted-foreground" /> Edit Task
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
            priority={priority}
            setPriority={setPriority}
            category={category}
            setCategory={setCategory}
          />
        )}

        <div className="flex justify-between pt-6 border-t border-muted mt-4">
          <Button
            variant="ghost"
            onClick={handleDelete}
            className="flex items-center gap-2 text-muted-foreground hover:text-destructive"
          >
            <Trash className="h-4 w-4" />
            Delete Task
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
              onClick={handleSave}
              className="bg-gradient-to-r from-[#FF6A79] to-[#415AFF] text-white hover:opacity-90"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </GlassModalContent>
    </GlassModal>
  );
}
