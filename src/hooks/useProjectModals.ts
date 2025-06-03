
import { useState } from "react";

export function useProjectModals() {
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  const [isCreatePromptModalOpen, setIsCreatePromptModalOpen] = useState(false);
  
  const openCommandModal = () => setIsCommandModalOpen(true);
  const closeCommandModal = () => setIsCommandModalOpen(false);
  
  const openCreatePromptModal = () => setIsCreatePromptModalOpen(true);
  const closeCreatePromptModal = () => setIsCreatePromptModalOpen(false);
  
  return {
    isCommandModalOpen,
    isCreatePromptModalOpen,
    openCommandModal,
    closeCommandModal,
    openCreatePromptModal,
    closeCreatePromptModal
  };
}
