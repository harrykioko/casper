import { 
  LayoutDashboard, 
  CheckSquare, 
  FileText, 
  Paperclip, 
  MessageSquare, 
  Clock 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DealRoomTab } from '@/pages/PipelineCompanyDetail';

interface DealRoomTabsProps {
  activeTab: DealRoomTab;
  onTabChange: (tab: DealRoomTab) => void;
  counts: {
    tasks: number;
    notes: number;
    files: number;
    comms: number;
  };
}

interface TabItemProps {
  tab: DealRoomTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  isActive: boolean;
  onClick: () => void;
}

function TabItem({ tab, label, icon: Icon, count, isActive, onClick }: TabItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
        "hover:bg-muted/50",
        isActive 
          ? "bg-primary/10 text-primary border-l-2 border-primary -ml-px pl-[11px]" 
          : "text-muted-foreground"
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1 text-left">{label}</span>
      {count !== undefined && count > 0 && (
        <span 
          className={cn(
            "min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium flex items-center justify-center",
            isActive 
              ? "bg-primary/20 text-primary" 
              : "bg-muted text-muted-foreground"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export function DealRoomTabs({ activeTab, onTabChange, counts }: DealRoomTabsProps) {
  const tabs: Array<{
    tab: DealRoomTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    countKey?: keyof typeof counts;
  }> = [
    { tab: 'overview', label: 'Overview', icon: LayoutDashboard },
    { tab: 'tasks', label: 'Tasks', icon: CheckSquare, countKey: 'tasks' },
    { tab: 'notes', label: 'Notes', icon: FileText, countKey: 'notes' },
    { tab: 'files', label: 'Files', icon: Paperclip, countKey: 'files' },
    { tab: 'comms', label: 'Comms', icon: MessageSquare, countKey: 'comms' },
    { tab: 'timeline', label: 'Timeline', icon: Clock },
  ];

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-2 space-y-1">
      {tabs.map(({ tab, label, icon, countKey }) => (
        <TabItem
          key={tab}
          tab={tab}
          label={label}
          icon={icon}
          count={countKey ? counts[countKey] : undefined}
          isActive={activeTab === tab}
          onClick={() => onTabChange(tab)}
        />
      ))}
    </div>
  );
}
