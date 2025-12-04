import { Clock, CheckSquare, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CompanyCommandSummaryProps {
  lastInteractionAt: string | null | undefined;
  openTaskCount: number;
  status: string;
}

export function CompanyCommandSummary({ lastInteractionAt, openTaskCount, status }: CompanyCommandSummaryProps) {
  const formattedLastInteraction = lastInteractionAt
    ? formatDistanceToNow(new Date(lastInteractionAt), { addSuffix: true })
    : 'No interactions yet';

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-card/60 border border-border/40 backdrop-blur-sm rounded-xl p-4 text-center">
        <Clock className="w-5 h-5 mx-auto mb-1.5 text-muted-foreground" />
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Last Touch</p>
        <p className="text-sm font-medium text-foreground mt-1 truncate">{formattedLastInteraction}</p>
      </div>
      
      <div className="bg-card/60 border border-border/40 backdrop-blur-sm rounded-xl p-4 text-center">
        <CheckSquare className="w-5 h-5 mx-auto mb-1.5 text-muted-foreground" />
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Open Tasks</p>
        <p className="text-sm font-medium text-foreground mt-1">{openTaskCount}</p>
      </div>
      
      <div className="bg-card/60 border border-border/40 backdrop-blur-sm rounded-xl p-4 text-center">
        <Activity className="w-5 h-5 mx-auto mb-1.5 text-muted-foreground" />
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
        <p className="text-sm font-medium text-foreground mt-1 capitalize">{status}</p>
      </div>
    </div>
  );
}
