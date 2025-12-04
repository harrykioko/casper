import { Clock, CheckSquare, Activity, ArrowRight } from 'lucide-react';
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
    : 'No interactions yet';

  return (
    <div className="space-y-3">
      {/* Next Step highlight */}
      {nextTask && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <ArrowRight className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-primary font-medium uppercase tracking-wide mb-1">Next Step</p>
            <p className="text-sm font-medium text-foreground truncate">{nextTask}</p>
          </div>
        </div>
      )}

      {/* Summary grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card/50 border border-border/30 backdrop-blur-sm rounded-xl p-4 text-center">
          <Clock className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Last Touch</p>
          <p className="text-sm font-medium text-foreground mt-1 truncate">{formattedLastInteraction}</p>
        </div>
        
        <div className="bg-card/50 border border-border/30 backdrop-blur-sm rounded-xl p-4 text-center">
          <CheckSquare className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Open Tasks</p>
          <p className="text-sm font-medium text-foreground mt-1">{openTaskCount}</p>
        </div>
        
        <div className="bg-card/50 border border-border/30 backdrop-blur-sm rounded-xl p-4 text-center">
          <Activity className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
          <p className="text-sm font-medium text-foreground mt-1 capitalize">{status}</p>
        </div>
      </div>
    </div>
  );
}
