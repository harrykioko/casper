import { LucideIcon, LayoutDashboard, Users, FileText, CheckSquare, Mail, Calendar, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PortfolioMode = 'overview' | 'people' | 'notes' | 'tasks' | 'emails' | 'meetings' | 'files';

interface ModeItem {
  id: PortfolioMode;
  label: string;
  icon: LucideIcon;
  countKey?: string;
}

const modes: ModeItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'people', label: 'People', icon: Users, countKey: 'peopleCount' },
  { id: 'notes', label: 'Notes', icon: FileText, countKey: 'notesCount' },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare, countKey: 'tasksCount' },
  { id: 'emails', label: 'Emails', icon: Mail },
  { id: 'meetings', label: 'Meetings', icon: Calendar },
  { id: 'files', label: 'Files', icon: Paperclip },
];

interface PortfolioModeNavProps {
  currentMode: PortfolioMode;
  onModeChange: (mode: PortfolioMode) => void;
  counts?: {
    peopleCount?: number;
    notesCount?: number;
    tasksCount?: number;
  };
}

export function PortfolioModeNav({ currentMode, onModeChange, counts = {} }: PortfolioModeNavProps) {
  const getCount = (key?: string): number | undefined => {
    if (!key) return undefined;
    return counts[key as keyof typeof counts];
  };

  return (
    <nav className="space-y-1">
      {modes.map((mode) => {
        const isActive = currentMode === mode.id;
        const count = getCount(mode.countKey);
        const Icon = mode.icon;
        
        return (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
              'hover:bg-muted/50',
              isActive 
                ? 'bg-muted text-foreground border-l-2 border-primary' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 text-left">{mode.label}</span>
            {count !== undefined && count > 0 && (
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                isActive 
                  ? 'bg-primary/10 text-primary' 
                  : 'bg-muted text-muted-foreground'
              )}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
