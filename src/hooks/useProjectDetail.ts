import { useProjectData } from "./useProjectData";
import { useProjectTasks } from "./useProjectTasks";
import { useProjectPrompts } from "./useProjectPrompts";
import { useProjectLinks } from "./useProjectLinks";
import { useProjectModals } from "./useProjectModals";

export function useProjectDetail() {
  const { project, loading, updateProjectContext, updateProjectMetadata } = useProjectData();
  const { tasks, addTask } = useProjectTasks();
  const { prompts, addPrompt } = useProjectPrompts();
  const { links, addLink, removeLink } = useProjectLinks();
  const {
    isCommandModalOpen,
    isCreatePromptModalOpen,
    openCommandModal,
    closeCommandModal,
    openCreatePromptModal,
    closeCreatePromptModal
  } = useProjectModals();
  
  return {
    project,
    tasks,
    prompts,
    links,
    loading,
    isCommandModalOpen,
    isCreatePromptModalOpen,
    openCommandModal,
    closeCommandModal,
    openCreatePromptModal,
    closeCreatePromptModal,
    updateProjectContext,
    updateProjectMetadata,
    addTask,
    addPrompt,
    addLink,
    removeLink
  };
}
