import { ArrowRight, Clock, CheckSquare, DollarSign, Calendar } from 'lucide-react';
import { formatDistanceToNow, format, parseISO } from 'date-fns';

interface PipelineCommandSummaryProps {
  lastInteractionAt: string | null | undefined;
  openTaskCount: number;
  raiseAmount?: number | null;
  closeDate?: string | null;
  nextSteps?: string | null;
}

function formatRaise(amount: number | null | undefined): string {
  if (!amount) return '-';
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

export function PipelineCommandSummary({ 
  lastInteractionAt, 
  openTaskCount, 
  raiseAmount,
  closeDate,
  nextSteps 
}: PipelineCommandSummaryProps) {
  const formattedLastInteraction = lastInteractionAt
    ? formatDistanceToNow(new Date(lastInteractionAt), { addSuffix: true })
    : 'No interactions';

  const formattedCloseDate = closeDate
    ? format(parseISO(closeDate), 'MMM d, yyyy')
    : null;

  return (
    <div className="space-y-2">
      {/* Next Steps - inline compact card */}
      {nextSteps && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2.5 flex items-start gap-2.5">
          <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-primary font-medium uppercase tracking-wide block mb-0.5">Next Steps</span>
            <span className="text-sm font-medium text-foreground">{nextSteps}</span>
          </div>
        </div>
      )}

      {/* Overview stats - horizontal bar */}
      <div className="bg-card/40 border border-border/30 rounded-lg px-3 py-2 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide mr-1.5">Raise</span>
            <span className="text-sm font-medium text-foreground">{formatRaise(raiseAmount)}</span>
          </div>
        </div>

        {formattedCloseDate && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide mr-1.5">Close</span>
              <span className="text-sm font-medium text-foreground">{formattedCloseDate}</span>
            </div>
          </div>
        )}
        
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
      </div>
    </div>
  );
}
