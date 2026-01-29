import { useEffect } from "react";
import { Edit, Trash, StickyNote, Archive, ArchiveRestore } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Task } from "@/hooks/useTasks";
import { TaskDetailsForm } from "./task-details/TaskDetailsForm";
import { TaskLinksSection } from "./task-details/TaskLinksSection";
import { TaskActivitySection } from "./task-details/TaskActivitySection";
import { useTaskDetails } from "@/hooks/useTaskDetails";
import { toast } from "@/hooks/use-toast";
import { TaskNotesSection } from "@/components/notes/TaskNotesSection";
import { TaskAttachmentsSection } from "@/components/tasks/TaskAttachmentsSection";
import { useFloatingNote } from "@/contexts/FloatingNoteContext";

interface TaskDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onArchiveTask?: (id: string) => void;
  onUnarchiveTask?: (id: string) => void;
}

export function TaskDetailsDialog({
  open,
  onOpenChange,
  task,
  onUpdateTask,
  onDeleteTask,
  onArchiveTask,
  onUnarchiveTask,
}: TaskDetailsDialogProps) {
  const { openFloatingNote } = useFloatingNote();
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
    companyLink,
    setCompanyLink,
    createUpdatedTask,
  } = useTaskDetails({ task });

  const handleSave = () => {
    if (!task) return;

    const updatedTask = createUpdatedTask();
    if (!updatedTask) return;

    onUpdateTask(updatedTask);
    onOpenChange(false);
    toast({
      title: "Task updated",
      description: "Your task has been successfully updated.",
    });
  };

  const handleDelete = () => {
    if (!task) return;
    onDeleteTask(task.id);
    onOpenChange(false);
    toast({
      title: "Task deleted",
      description: "Your task has been successfully deleted.",
      variant: "destructive",
    });
  };

  const handleArchive = () => {
    if (!task) return;
    if (task.archived_at && onUnarchiveTask) {
      onUnarchiveTask(task.id);
      onOpenChange(false);
      toast({ title: "Task unarchived", description: "Task restored to active list." });
    } else if (onArchiveTask) {
      onArchiveTask(task.id);
      onOpenChange(false);
      toast({ title: "Task archived", description: "Task moved to archive." });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (open) {
        if ((e.metaKey || e.ctrlKey) && e.key === "s") {
          e.preventDefault();
          handleSave();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleSave]);

  const handleOpenFloatingNote = () => {
    if (!task) return;
    openFloatingNote({
      target: { targetType: "task", targetId: task.id, entityName: task.content },
      initialData: { initialTitle: task.content },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[480px] lg:w-[520px] p-0 flex flex-col bg-background border-l border-border"
      >
        {/* Header — pr-12 accounts for built-in Sheet close button */}
        <div className="flex items-center justify-between px-5 pr-12 py-4 border-b border-border bg-muted/30">
          <SheetTitle className="flex items-center gap-2 text-base font-semibold">
            <Edit className="w-4 h-4 text-muted-foreground" />
            Task Detail
          </SheetTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
            onClick={handleOpenFloatingNote}
            title="Open floating note"
          >
            <StickyNote className="w-4 h-4 mr-1" />
            Float
          </Button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {task && (
            <div className="px-5 py-5 space-y-6">
              {/* Properties section */}
              <div className="space-y-1">
                <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Properties
                </h4>
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
                  companyLink={companyLink}
                  setCompanyLink={setCompanyLink}
                />
              </div>

              {/* Links section */}
              <div className="border-t border-border pt-4">
                <TaskLinksSection task={task} companyLink={companyLink} />
              </div>

              {/* Notes section */}
              <div className="border-t border-border pt-4">
                <TaskNotesSection taskId={task.id} />
              </div>

              {/* Attachments section (from source inbox item) */}
              <div className="border-t border-border pt-4">
                <TaskAttachmentsSection taskId={task.id} />
              </div>

              {/* Activity section */}
              <div className="border-t border-border pt-4">
                <TaskActivitySection task={task} />
              </div>
            </div>
          )}
        </div>

        {/* Footer actions — pinned to bottom */}
        <div className="flex justify-between px-5 py-4 border-t border-border bg-muted/30">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-destructive"
            >
              <Trash className="h-3.5 w-3.5" />
              Delete
            </Button>
            {(onArchiveTask || onUnarchiveTask) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleArchive}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                {task?.archived_at ? (
                  <>
                    <ArchiveRestore className="h-3.5 w-3.5" />
                    Unarchive
                  </>
                ) : (
                  <>
                    <Archive className="h-3.5 w-3.5" />
                    Archive
                  </>
                )}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-gradient-to-r from-[#FF6A79] to-[#415AFF] text-white hover:opacity-90"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
