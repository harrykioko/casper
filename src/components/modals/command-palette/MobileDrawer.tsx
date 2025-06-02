
import { useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { CommandItem, CommandGroup } from '@/types/commandPalette';
import { CommandGroupComponent } from './CommandGroupComponent';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  setQuery: (query: string) => void;
  filteredGroups: CommandGroup[];
  allItems: CommandItem[];
  selectedIndex: number;
  executeCommand: (item: CommandItem) => void;
}

export function MobileDrawer({ 
  isOpen, 
  onClose, 
  query, 
  setQuery, 
  filteredGroups, 
  allItems, 
  selectedIndex, 
  executeCommand 
}: MobileDrawerProps) {
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
