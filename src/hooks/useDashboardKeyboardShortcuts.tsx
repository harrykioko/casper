
import { useEffect } from "react";

interface KeyboardShortcutsProps {
  openCommandModal: () => void;
}

export function useDashboardKeyboardShortcuts({ openCommandModal }: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openCommandModal();
      }
    };

    // Add event listener
    document.addEventListener("keydown", handleKeyDown);
    
    // Clean up
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openCommandModal]);
}

