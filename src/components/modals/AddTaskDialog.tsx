
import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { GlassModal, GlassModalContent, GlassModalHeader, GlassModalTitle, GlassModalFooter } from "@/components/ui/GlassModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTask: (content: string) => void;
}

export function AddTaskDialog({ open, onOpenChange, onAddTask }: AddTaskDialogProps) {
  const [taskContent, setTaskContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setTaskContent("");
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!taskContent.trim()) return;

    try {
      setIsLoading(true);
      
      onAddTask(taskContent);
      toast.success("Task added successfully");
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error("Failed to add task. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GlassModal open={open} onOpenChange={onOpenChange}>
      <GlassModalContent className="max-w-lg">
        <GlassModalHeader>
          <GlassModalTitle className="flex items-center gap-2">
            <Check className="h-4 w-4" /> Add New Task
          </GlassModalTitle>
        </GlassModalHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              placeholder="Enter task description..."
              value={taskContent}
              onChange={(e) => setTaskContent(e.target.value)}
              className="pr-10 focus-visible:ring-0 focus-visible:ring-offset-0 border-muted/30 focus-visible:border-muted/50 hover:border-muted/50 transition-colors"
              disabled={isLoading}
              autoFocus
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </div>
          
          <GlassModalFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!taskContent.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Add Task"
              )}
            </Button>
          </GlassModalFooter>
        </form>
      </GlassModalContent>
    </GlassModal>
  );
}
