
import { AddLinkDialog } from "@/components/modals/AddLinkDialog";
import { AddTaskDialog } from "@/components/modals/AddTaskDialog";
import { CreateProjectModal } from "@/components/modals/CreateProjectModal";
import { ReadingItem } from "@/types/readingItem";

interface DashboardDialogsProps {
  addLinkDialogOpen: boolean;
  setAddLinkDialogOpen: (open: boolean) => void;
  addTaskDialogOpen: boolean;
  setAddTaskDialogOpen: (open: boolean) => void;
  createProjectModalOpen: boolean;
  setCreateProjectModalOpen: (open: boolean) => void;
  onAddReadingItem: (itemData: Omit<ReadingItem, 'id'>) => void;
  onAddTask: (content: string) => void;
  onCreateProject: (data: any) => void;
}

export function DashboardDialogs({
  addLinkDialogOpen,
  setAddLinkDialogOpen,
  addTaskDialogOpen,
  setAddTaskDialogOpen,
  createProjectModalOpen,
  setCreateProjectModalOpen,
  onAddReadingItem,
  onAddTask,
  onCreateProject,
}: DashboardDialogsProps) {
  return (
    <>
      {/* Add Link Dialog */}
      <AddLinkDialog
        open={addLinkDialogOpen}
        onOpenChange={setAddLinkDialogOpen}
        onAddLink={onAddReadingItem}
      />

      {/* Add Task Dialog */}
      <AddTaskDialog
        open={addTaskDialogOpen}
        onOpenChange={setAddTaskDialogOpen}
        onAddTask={onAddTask}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        open={createProjectModalOpen}
        onOpenChange={setCreateProjectModalOpen}
        onCreateProject={onCreateProject}
      />
    </>
  );
}
