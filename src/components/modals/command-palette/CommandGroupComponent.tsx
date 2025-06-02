
import { CommandItem, CommandGroup } from '@/types/commandPalette';
import { CommandItemComponent } from './CommandItemComponent';

interface CommandGroupComponentProps {
  group: CommandGroup;
  allItems: CommandItem[];
  selectedIndex: number;
  onExecute: (item: CommandItem) => void;
  isFirst?: boolean;
}

export function CommandGroupComponent({ 
  group, 
  allItems, 
  selectedIndex, 
  onExecute,
  isFirst = false
}: CommandGroupComponentProps) {
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
