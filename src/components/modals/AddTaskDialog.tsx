
import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
      
      // Add the task
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="h-4 w-4" /> Add New Task
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              placeholder="Enter task description..."
              value={taskContent}
              onChange={(e) => setTaskContent(e.target.value)}
              className="pr-10 focus-visible:ring-0 focus-visible:ring-offset-0 border-gray-300 dark:border-gray-700 focus-visible:border-gray-400 dark:focus-visible:border-gray-500 hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
              disabled={isLoading}
              autoFocus
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </div>
          
          <DialogFooter className="sm:justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!taskContent.trim() || isLoading}
              className="w-full py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition shadow"
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
