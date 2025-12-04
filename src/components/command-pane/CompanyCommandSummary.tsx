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
      <div className="bg-muted/30 rounded-lg p-3 text-center">
        <Clock className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Last Touch</p>
        <p className="text-xs font-medium text-foreground mt-0.5 truncate">{formattedLastInteraction}</p>
      </div>
      
      <div className="bg-muted/30 rounded-lg p-3 text-center">
        <CheckSquare className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Open Tasks</p>
        <p className="text-xs font-medium text-foreground mt-0.5">{openTaskCount}</p>
      </div>
      
      <div className="bg-muted/30 rounded-lg p-3 text-center">
        <Activity className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Status</p>
        <p className="text-xs font-medium text-foreground mt-0.5 capitalize">{status}</p>
      </div>
    </div>
  );
}
