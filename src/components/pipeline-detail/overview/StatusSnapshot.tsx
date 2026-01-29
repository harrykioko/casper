import { CheckSquare, FileText, Paperclip, Clock } from 'lucide-react';
import { GlassPanel } from '@/components/ui/glass-panel';

interface StatusSnapshotProps {
  openTasksCount: number;
  notesCount: number;
  filesCount: number;
  daysSinceLastActivity: number | null;
}

interface StatRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
}

function StatRow({ icon: Icon, label, value }: StatRowProps) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span className="flex-1 text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export function StatusSnapshot({
  openTasksCount,
  notesCount,
  filesCount,
  daysSinceLastActivity,
}: StatusSnapshotProps) {
  const activityLabel = daysSinceLastActivity === null 
    ? 'No activity'
    : daysSinceLastActivity === 0 
      ? 'Today'
      : daysSinceLastActivity === 1 
        ? '1 day ago'
        : `${daysSinceLastActivity} days ago`;

  return (
    <GlassPanel variant="subtle" padding="md">
      <div className="space-y-1">
        <StatRow icon={CheckSquare} label="Open tasks" value={openTasksCount} />
        <StatRow icon={FileText} label="Notes" value={notesCount} />
        <StatRow icon={Paperclip} label="Files" value={filesCount} />
        <div className="pt-2 mt-2 border-t border-border/50">
          <StatRow icon={Clock} label="Last activity" value={activityLabel} />
        </div>
      </div>
    </GlassPanel>
  );
}
