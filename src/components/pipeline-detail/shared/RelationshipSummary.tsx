import { CheckSquare, FileText, Paperclip, MessageSquare, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { GlassPanel, GlassPanelHeader } from '@/components/ui/glass-panel';

interface RelationshipSummaryProps {
  openTasksCount: number;
  notesCount: number;
  filesCount: number;
  commsCount: number;
  lastActivityAt?: string | null;
}

interface StatChipProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
}

function StatChip({ icon: Icon, label, count }: StatChipProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground ml-auto">{count}</span>
    </div>
  );
}

export function RelationshipSummary({
  openTasksCount,
  notesCount,
  filesCount,
  commsCount,
  lastActivityAt,
}: RelationshipSummaryProps) {
  const lastActivity = lastActivityAt
    ? formatDistanceToNow(new Date(lastActivityAt), { addSuffix: true })
    : 'No activity yet';

  return (
    <GlassPanel>
      <GlassPanelHeader title="Relationship Summary" />
      
      <div className="p-4 space-y-2">
        <StatChip icon={CheckSquare} label="Open tasks" count={openTasksCount} />
        <StatChip icon={FileText} label="Notes" count={notesCount} />
        <StatChip icon={Paperclip} label="Files" count={filesCount} />
        <StatChip icon={MessageSquare} label="Comms" count={commsCount} />
        
        <div className="flex items-center gap-2 pt-2 mt-2 border-t border-border">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Last activity</span>
          <span className="text-sm text-foreground ml-auto">{lastActivity}</span>
        </div>
      </div>
    </GlassPanel>
  );
}
