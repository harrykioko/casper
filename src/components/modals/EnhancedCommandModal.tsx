
import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { CommandItem, CommandGroup } from '@/types/commandPalette';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer';

interface EnhancedCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (path: string) => void;
  onAddTask?: () => void;
  onAddProject?: () => void;
  onAddPrompt?: () => void;
  onAddLink?: () => void;
}

function CommandItemComponent({ 
  item, 
  isSelected, 
  onExecute 
}: { 
  item: CommandItem; 
  isSelected: boolean; 
  onExecute: (item: CommandItem) => void; 
}) {
  const Icon = item.icon;
  
  return (
    <div
      className={`px-3 py-2 rounded-lg cursor-pointer flex gap-3 items-center transition-all duration-200 ${
        isSelected 
          ? 'bg-muted/50 ring-1 ring-muted/50' 
          : 'bg-muted/30 hover:bg-muted/50'
      }`}
      onClick={() => onExecute(item)}
    >
      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground">{item.title}</div>
        {item.description && (
          <div className="text-xs text-muted-foreground truncate">{item.description}</div>
        )}
      </div>
      {item.shortcut && (
        <kbd className="text-xs font-medium bg-muted/60 text-muted-foreground border px-2 py-1 rounded-md ml-auto flex-shrink-0">
          {item.shortcut}
        </kbd>
      )}
    </div>
  );
}

function CommandGroupComponent({ 
  group, 
  allItems, 
  selectedIndex, 
  onExecute,
  isFirst = false
}: { 
  group: CommandGroup; 
  allItems: CommandItem[]; 
  selectedIndex: number; 
  onExecute: (item: CommandItem) => void; 
  isFirst?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className={`text-xs uppercase tracking-wide font-medium text-muted-foreground/80 pt-3 pb-1 ${!isFirst ? 'border-t border-muted/20' : 'first:pt-0'}`}>
        {group.title}
      </div>
      <div className="space-y-2">
        {group.items.map((item) => {
          const itemIndex = allItems.findIndex(i => i.id === item.id);
          return (
            <CommandItemComponent
              key={item.id}
              item={item}
              isSelected={itemIndex === selectedIndex}
              onExecute={onExecute}
            />
          );
        })}
      </div>
    </div>
  );
}

function DesktopModal({ 
  isOpen, 
  onClose, 
  query, 
  setQuery, 
  filteredGroups, 
  allItems, 
  selectedIndex, 
  executeCommand 
}: {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  setQuery: (query: string) => void;
  filteredGroups: CommandGroup[];
  allItems: CommandItem[];
  selectedIndex: number;
  executeCommand: (item: CommandItem) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => document.body.classList.remove('overflow-hidden');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="max-w-lg w-full rounded-2xl backdrop-blur-xl bg-muted/20 border border-muted/30 shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-muted/30">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a command or search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 text-sm bg-muted/30 placeholder-muted-foreground/70 text-foreground px-4 py-2 rounded-xl border border-muted/30 backdrop-blur outline-none focus:ring-1 focus:ring-primary/30 transition-all"
            />
            <kbd className="text-xs font-medium bg-muted/60 px-2 py-1 rounded-md text-muted-foreground border flex-shrink-0">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto p-4 space-y-3 scrollbar-none">
            {filteredGroups.length > 0 ? (
              filteredGroups.map((group, index) => (
                <CommandGroupComponent
                  key={group.id}
                  group={group}
                  allItems={allItems}
                  selectedIndex={selectedIndex}
                  onExecute={executeCommand}
                  isFirst={index === 0}
                />
              ))
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No results found.
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function MobileDrawer({ 
  isOpen, 
  onClose, 
  query, 
  setQuery, 
  filteredGroups, 
  allItems, 
  selectedIndex, 
  executeCommand 
}: {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  setQuery: (query: string) => void;
  filteredGroups: CommandGroup[];
  allItems: CommandItem[];
  selectedIndex: number;
  executeCommand: (item: CommandItem) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[80vh] rounded-t-2xl backdrop-blur-xl bg-muted/20 border border-muted/30">
        <DrawerHeader>
          <DrawerTitle className="sr-only">Command Palette</DrawerTitle>
          <div className="flex items-center gap-3 p-4 border-b border-muted/30">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a command or search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 text-sm bg-muted/30 placeholder-muted-foreground/70 text-foreground px-4 py-2 rounded-xl border border-muted/30 backdrop-blur outline-none focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>
        </DrawerHeader>
        
        <div className="overflow-y-auto p-4 space-y-3 scrollbar-none">
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group, index) => (
              <CommandGroupComponent
                key={group.id}
                group={group}
                allItems={allItems}
                selectedIndex={selectedIndex}
                onExecute={executeCommand}
                isFirst={index === 0}
              />
            ))
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No results found.
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
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
