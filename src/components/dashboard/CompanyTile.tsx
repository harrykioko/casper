import { Badge } from '@/components/ui/badge';
import { Clock, CheckSquare, ArrowRight } from 'lucide-react';
import { formatDistanceToNow, differenceInDays, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface CompanyTileProps {
  type: 'portfolio' | 'pipeline';
  name: string;
  logoUrl?: string | null;
  status?: string;
  lastTouch?: string | null;
  openTaskCount?: number;
  nextTask?: string | null;
  onClick: () => void;
}

const statusColors: Record<string, string> = {
  // Portfolio statuses
  active: 'bg-status-active/10 text-status-active',
  watching: 'bg-status-warning/10 text-status-warning',
  exited: 'bg-status-info/10 text-status-info',
  archived: 'bg-muted text-muted-foreground',
  // Pipeline statuses
  new: 'bg-status-info/10 text-status-info',
  interesting: 'bg-accent-purple/10 text-accent-purple',
  pearls: 'bg-accent-coral/10 text-accent-coral',
  to_share: 'bg-status-warning/10 text-status-warning',
  passed: 'bg-muted text-muted-foreground',
};

function getHealthDotColor(lastTouch: string | null): string {
  if (!lastTouch) return 'bg-status-danger';
  
  const days = differenceInDays(new Date(), parseISO(lastTouch));
  
  if (days <= 7) return 'bg-status-active';
  if (days <= 14) return 'bg-status-warning';
  return 'bg-status-danger';
}

export function CompanyTile({
  type,
  name,
  logoUrl,
  status,
  lastTouch,
  openTaskCount = 0,
  nextTask,
  onClick,
}: CompanyTileProps) {
  const formattedLastTouch = lastTouch
    ? formatDistanceToNow(new Date(lastTouch), { addSuffix: true })
    : 'No interactions';

  const statusColorClass = status ? statusColors[status] || 'bg-muted text-muted-foreground' : '';
  const healthDotColor = getHealthDotColor(lastTouch);

  return (
    <div
      className={cn(
        "min-w-[220px] max-w-[240px] p-4 cursor-pointer transition-all duration-200 ease-out",
        "rounded-2xl backdrop-blur-xl",
        "bg-white/60 dark:bg-zinc-900/40",
        "border border-white/30 dark:border-white/[0.08]",
        "shadow-glass-light dark:shadow-glass-dark",
        "hover:-translate-y-1 hover:shadow-glass-hover dark:hover:shadow-glass-dark-hover",
        "flex-shrink-0"
      )}
      onClick={onClick}
    >
      {/* Top row: Logo, health dot, and status */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="relative">
          <div className="w-11 h-11 rounded-xl bg-white dark:bg-zinc-800 border border-border/50 flex items-center justify-center overflow-hidden p-1.5 flex-shrink-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={name}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <span className="text-lg font-semibold text-muted-foreground">
                {name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          {/* Health indicator dot */}
          <div className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full ${healthDotColor} border-2 border-white dark:border-zinc-900`} />
        </div>
        {status && (
          <Badge variant="secondary" className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusColorClass)}>
            {status.replace('_', ' ')}
          </Badge>
        )}
      </div>

      {/* Company name */}
      <h4 className="font-semibold text-base text-foreground truncate mb-2">{name}</h4>

      {/* Next step */}
      {nextTask && (
        <div className="flex items-center gap-1.5 text-sm text-primary mb-3 bg-primary/5 dark:bg-primary/10 rounded-lg px-2.5 py-1.5">
          <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate font-medium text-xs">Next: {nextTask}</span>
        </div>
      )}

      {/* Bottom row: Last touch and tasks */}
      <div className="space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{formattedLastTouch}</span>
        </div>
        {type === 'portfolio' && (
          <div className="flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{openTaskCount} open tasks</span>
          </div>
        )}
      </div>
    </div>
  );
}
