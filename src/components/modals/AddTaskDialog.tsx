import { useState, useEffect } from "react";
import { Check, Loader2 } from "lucide-react";
import { GlassModal, GlassModalContent, GlassModalHeader, GlassModalTitle, GlassModalFooter } from "@/components/ui/GlassModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { TaskPrefillOptions } from "@/types/inbox";

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTask: (content: string) => void;
  prefill?: TaskPrefillOptions;
}

export function AddTaskDialog({ open, onOpenChange, onAddTask, prefill }: AddTaskDialogProps) {
  const [taskContent, setTaskContent] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Apply prefill values when dialog opens
  useEffect(() => {
    if (open && prefill) {
      setTaskContent(prefill.content || "");
      setTaskDescription(prefill.description || "");
    }
  }, [open, prefill]);

  const resetForm = () => {
    setTaskContent("");
    setTaskDescription("");
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!taskContent.trim()) return;

    try {
      setIsLoading(true);
      
      // For now, just pass the content. In the future, could pass full object with description, companyId, etc.
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

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  return (
    <GlassModal open={open} onOpenChange={handleOpenChange}>
      <GlassModalContent className="max-w-lg">
        <GlassModalHeader>
          <GlassModalTitle className="flex items-center gap-2">
            <Check className="h-4 w-4" /> Add New Task
          </GlassModalTitle>
        </GlassModalHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-content">Task</Label>
            <div className="relative">
              <Input
                id="task-content"
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
          </div>

          {/* Show description field if there's prefill content or user starts typing */}
          {(prefill?.description || taskDescription) && (
            <div className="space-y-2">
              <Label htmlFor="task-description">Notes</Label>
              <Textarea
                id="task-description"
                placeholder="Add additional context..."
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                className="min-h-[80px] focus-visible:ring-0 focus-visible:ring-offset-0 border-muted/30 focus-visible:border-muted/50 hover:border-muted/50 transition-colors resize-none"
                disabled={isLoading}
              />
            </div>
          )}

          {/* Show related company info if available */}
          {prefill?.companyName && (
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Related to</p>
              <p className="text-sm font-medium text-foreground">{prefill.companyName}</p>
            </div>
          )}
          
          <GlassModalFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleOpenChange(false)}
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
