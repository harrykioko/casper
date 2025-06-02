
import { useState, useEffect } from "react";

export function useCommandModal() {
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  
  const openCommandModal = () => setIsCommandModalOpen(true);
  const closeCommandModal = () => setIsCommandModalOpen(false);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openCommandModal();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    isCommandModalOpen,
    openCommandModal,
    closeCommandModal
  };
}
