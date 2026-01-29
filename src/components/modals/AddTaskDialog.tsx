import { useState, useEffect } from "react";
import { Check, Loader2 } from "lucide-react";
import { GlassModal, GlassModalContent, GlassModalHeader, GlassModalTitle, GlassModalFooter } from "@/components/ui/GlassModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { TaskPrefillOptions } from "@/types/inbox";
import { createNote } from "@/hooks/useNotes";
import { CompanySelector } from "./task-details/CompanySelector";
import { setTaskCompanyLink, type TaskCompanyLink } from "@/lib/taskCompanyLink";

export interface TaskCreateData {
  content: string;
  description?: string;
  source_inbox_item_id?: string;
  company_id?: string;
  pipeline_company_id?: string;
}

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTask: (taskData: TaskCreateData) => Promise<{ id: string }> | void;
  prefill?: TaskPrefillOptions;
}

export function AddTaskDialog({ open, onOpenChange, onAddTask, prefill }: AddTaskDialogProps) {
  const [taskContent, setTaskContent] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [companyLink, setCompanyLink] = useState<TaskCompanyLink | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Apply prefill values when dialog opens
  useEffect(() => {
    if (open && prefill) {
      setTaskContent(prefill.content || "");
      setTaskDescription(prefill.description || "");
      // Seed company selector from prefill
      if (prefill.companyId) {
        setCompanyLink({
          type: prefill.companyType === 'pipeline' ? 'pipeline' : 'portfolio',
          id: prefill.companyId,
          name: prefill.companyName,
        });
      } else {
        setCompanyLink(null);
      }
    }
  }, [open, prefill]);

  const resetForm = () => {
    setTaskContent("");
    setTaskDescription("");
    setCompanyLink(null);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!taskContent.trim()) return;

    try {
      setIsLoading(true);

      // Build full task data object including source_inbox_item_id and company links
      const taskData: TaskCreateData = {
        content: taskContent,
      };

      // Include source inbox item ID if this task originated from an email
      if (prefill?.sourceInboxItemId) {
        taskData.source_inbox_item_id = prefill.sourceInboxItemId;
      }

      // Include company links from selector
      const companyFields = setTaskCompanyLink(companyLink);
      if (companyFields.company_id) taskData.company_id = companyFields.company_id;
      if (companyFields.pipeline_company_id) taskData.pipeline_company_id = companyFields.pipeline_company_id;

      // Create the task — onAddTask may return the created task with its id
      const result = await onAddTask(taskData);

      // If we got a task id back and user entered an initial note, persist it
      const noteText = taskDescription.trim();
      if (result?.id && noteText) {
        await createNote({
          content: noteText,
          primaryContext: { targetType: 'task', targetId: result.id },
        });
      }

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

          <div className="space-y-2">
            <Label htmlFor="task-description">Initial note <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              id="task-description"
              placeholder="Add context, details, or background for this task..."
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className="min-h-[80px] focus-visible:ring-0 focus-visible:ring-offset-0 border-muted/30 focus-visible:border-muted/50 hover:border-muted/50 transition-colors resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Company selector */}
          <CompanySelector companyLink={companyLink} onCompanyChange={setCompanyLink} />
          
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
