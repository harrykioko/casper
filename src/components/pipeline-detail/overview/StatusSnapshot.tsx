import { CheckSquare, FileText, Paperclip, Clock, Sparkles } from 'lucide-react';
import { GlassPanel } from '@/components/ui/glass-panel';
import { HarmonicEnrichment } from '@/types/enrichment';
import { formatDistanceToNow } from 'date-fns';

interface StatusSnapshotProps {
  openTasksCount: number;
  notesCount: number;
  filesCount: number;
  daysSinceLastActivity: number | null;
  enrichment?: HarmonicEnrichment | null;
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
  enrichment,
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
        <div className="pt-2 mt-2 border-t border-border/50">
          <div className="flex items-center gap-2.5 py-1.5">
            <Sparkles className="w-4 h-4 text-muted-foreground" />
            <span className="flex-1 text-sm text-muted-foreground">Harmonic</span>
            <span className="text-sm text-muted-foreground">
              {enrichment ? (
                <>
                  Connected
                  <span className="text-xs ml-1">
                    • {formatDistanceToNow(new Date(enrichment.last_refreshed_at))} ago
                  </span>
                </>
              ) : (
                'Not connected'
              )}
            </span>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
