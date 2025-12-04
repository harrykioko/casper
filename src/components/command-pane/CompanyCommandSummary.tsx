import { ArrowRight, Clock, CheckSquare, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CompanyCommandSummaryProps {
  lastInteractionAt: string | null | undefined;
  openTaskCount: number;
  status: string;
  nextTask?: string | null;
}

export function CompanyCommandSummary({ lastInteractionAt, openTaskCount, status, nextTask }: CompanyCommandSummaryProps) {
  const formattedLastInteraction = lastInteractionAt
    ? formatDistanceToNow(new Date(lastInteractionAt), { addSuffix: true })
    : 'No interactions';

  return (
    <div className="space-y-2">
      {/* Next Step - inline compact card */}
      {nextTask && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2.5 flex items-center gap-2.5">
          <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-primary font-medium uppercase tracking-wide mr-2">Next Step</span>
            <span className="text-sm font-medium text-foreground truncate">{nextTask}</span>
          </div>
        </div>
      )}

      {/* Overview stats - horizontal bar */}
      <div className="bg-card/40 border border-border/30 rounded-lg px-3 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide mr-1.5">Last Touch</span>
            <span className="text-sm font-medium text-foreground">{formattedLastInteraction}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          <CheckSquare className="w-3.5 h-3.5 text-muted-foreground" />
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide mr-1.5">Tasks</span>
            <span className="text-sm font-medium text-foreground">{openTaskCount} open</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-muted-foreground" />
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide mr-1.5">Status</span>
            <span className="text-sm font-medium text-foreground capitalize">{status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
