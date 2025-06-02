
import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { CommandItem, CommandGroup } from '@/types/commandPalette';
import { CommandGroupComponent } from './CommandGroupComponent';

interface DesktopModalProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  setQuery: (query: string) => void;
  filteredGroups: CommandGroup[];
  allItems: CommandItem[];
  selectedIndex: number;
  executeCommand: (item: CommandItem) => void;
}

export function DesktopModal({ 
  isOpen, 
  onClose, 
  query, 
  setQuery, 
  filteredGroups, 
  allItems, 
  selectedIndex, 
  executeCommand 
}: DesktopModalProps) {
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
