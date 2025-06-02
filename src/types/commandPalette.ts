
export interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ComponentType<any>;
  action: () => void;
  group: 'navigation' | 'actions' | 'recent';
  keywords?: string[];
  shortcut?: string;
}

export interface CommandGroup {
  id: string;
  title: string;
  items: CommandItem[];
}
