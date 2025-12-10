import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { NoteTargetType } from '@/types/notes';
import { FloatingNoteOverlay } from '@/components/notes/FloatingNoteOverlay';

export type FloatingNoteContextTarget = {
  targetType?: NoteTargetType;
  targetId?: string;
  entityName?: string;
};

export type FloatingNoteInitialData = {
  initialTitle?: string;
  initialContent?: string;
  initialNoteType?: string;
};

export interface FloatingNoteContextValue {
  isOpen: boolean;
  openFloatingNote: (options?: {
    target?: FloatingNoteContextTarget;
    initialData?: FloatingNoteInitialData;
  }) => void;
  closeFloatingNote: () => void;
  currentTarget?: FloatingNoteContextTarget;
  initialData?: FloatingNoteInitialData;
}

const FloatingNoteContext = createContext<FloatingNoteContextValue | null>(null);

export function useFloatingNote() {
  const context = useContext(FloatingNoteContext);
  if (!context) {
    throw new Error('useFloatingNote must be used within a FloatingNoteProvider');
  }
  return context;
}

interface FloatingNoteProviderProps {
  children: ReactNode;
}

export function FloatingNoteProvider({ children }: FloatingNoteProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTarget, setCurrentTarget] = useState<FloatingNoteContextTarget | undefined>();
  const [initialData, setInitialData] = useState<FloatingNoteInitialData | undefined>();

  const openFloatingNote = (options?: {
    target?: FloatingNoteContextTarget;
    initialData?: FloatingNoteInitialData;
  }) => {
    setCurrentTarget(options?.target);
    setInitialData(options?.initialData);
    setIsOpen(true);
  };

  const closeFloatingNote = () => {
    setIsOpen(false);
    // Clear state after close animation
    setTimeout(() => {
      setCurrentTarget(undefined);
      setInitialData(undefined);
    }, 200);
  };

  // Global keyboard shortcut: ⌘+Shift+N (Mac) / Ctrl+Shift+N (Windows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘+Shift+N or Ctrl+Shift+N to toggle floating note
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        if (isOpen) {
          closeFloatingNote();
        } else {
          openFloatingNote(); // Opens in scratch note mode
        }
      }
      
      // Escape to close when open
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        closeFloatingNote();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const value: FloatingNoteContextValue = {
    isOpen,
    openFloatingNote,
    closeFloatingNote,
    currentTarget,
    initialData,
  };

  return (
    <FloatingNoteContext.Provider value={value}>
      {children}
      {isOpen && createPortal(
        <FloatingNoteOverlay
          target={currentTarget}
          initialData={initialData}
          onClose={closeFloatingNote}
        />,
        document.body
      )}
    </FloatingNoteContext.Provider>
  );
}
