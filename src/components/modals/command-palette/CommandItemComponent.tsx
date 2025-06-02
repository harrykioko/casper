
import { CommandItem } from '@/types/commandPalette';

interface CommandItemComponentProps {
  item: CommandItem;
  isSelected: boolean;
  onExecute: (item: CommandItem) => void;
}

export function CommandItemComponent({ 
  item, 
  isSelected, 
  onExecute 
}: CommandItemComponentProps) {
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
