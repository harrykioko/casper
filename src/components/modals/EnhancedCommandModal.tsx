
import { useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { DesktopModal } from './command-palette/DesktopModal';
import { MobileDrawer } from './command-palette/MobileDrawer';

interface EnhancedCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (path: string) => void;
  onAddTask?: () => void;
  onAddProject?: () => void;
  onAddPrompt?: () => void;
  onAddLink?: () => void;
}

export function EnhancedCommandModal(props: EnhancedCommandModalProps) {
  const isMobile = useIsMobile();
  const commandPalette = useCommandPalette({
    onNavigate: props.onNavigate,
    onAddTask: props.onAddTask,
    onAddProject: props.onAddProject,
    onAddPrompt: props.onAddPrompt,
    onAddLink: props.onAddLink
  });

  // Sync external control with internal state
  useEffect(() => {
    if (props.isOpen && !commandPalette.isOpen) {
      commandPalette.open();
    } else if (!props.isOpen && commandPalette.isOpen) {
      commandPalette.close();
    }
  }, [props.isOpen]);

  // Sync internal close with external handler
  useEffect(() => {
    if (!commandPalette.isOpen && props.isOpen) {
      props.onClose();
    }
  }, [commandPalette.isOpen]);

  const commonProps = {
    isOpen: commandPalette.isOpen,
    onClose: commandPalette.close,
    query: commandPalette.query,
    setQuery: commandPalette.setQuery,
    filteredGroups: commandPalette.filteredGroups,
    allItems: commandPalette.allItems,
    selectedIndex: commandPalette.selectedIndex,
    executeCommand: commandPalette.executeCommand
  };

  return isMobile ? (
    <MobileDrawer {...commonProps} />
  ) : (
    <DesktopModal {...commonProps} />
  );
}
