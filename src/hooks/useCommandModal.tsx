
import { useState } from "react";

export function useCommandModal() {
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  
  const openCommandModal = () => setIsCommandModalOpen(true);
  const closeCommandModal = () => setIsCommandModalOpen(false);

  return {
    isCommandModalOpen,
    openCommandModal,
    closeCommandModal
  };
}
