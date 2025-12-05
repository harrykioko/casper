import { Badge } from '@/components/ui/badge';
import { Clock, CheckSquare, ArrowRight } from 'lucide-react';
import { formatDistanceToNow, differenceInDays, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface CompanyGridCardProps {
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
  active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  watching: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  exited: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  archived: 'bg-muted text-muted-foreground',
  // Pipeline statuses
  new: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  interesting: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  pearls: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  to_share: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  passed: 'bg-muted text-muted-foreground',
};

function getHealthDotColor(lastTouch: string | null): string {
  if (!lastTouch) return 'bg-red-500';
  
  const days = differenceInDays(new Date(), parseISO(lastTouch));
  
  if (days <= 7) return 'bg-emerald-500';
  if (days <= 14) return 'bg-amber-500';
  return 'bg-red-500';
}

export function CompanyGridCard({
  type,
  name,
  logoUrl,
  status,
  lastTouch,
  openTaskCount = 0,
  nextTask,
  onClick,
}: CompanyGridCardProps) {
  const formattedLastTouch = lastTouch
    ? formatDistanceToNow(new Date(lastTouch), { addSuffix: true })
    : 'No interactions';

  const statusColorClass = status ? statusColors[status] || 'bg-muted text-muted-foreground' : '';
  const healthDotColor = getHealthDotColor(lastTouch);

  return (
    <div
      onClick={onClick}
      className="cursor-pointer h-[180px] p-4 bg-card/60 backdrop-blur-sm rounded-xl border border-border/40 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
    >
      {/* Header: Logo + Status */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-800 border flex items-center justify-center overflow-hidden p-1.5 flex-shrink-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={name}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <span className="text-base font-semibold text-muted-foreground">
                {name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          {/* Health indicator dot */}
          <div className={cn('absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card', healthDotColor)} />
        </div>
        {status && (
          <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0 rounded-full', statusColorClass)}>
            {status.replace('_', ' ')}
          </Badge>
        )}
      </div>

      {/* Company name */}
      <h4 className="font-medium text-sm text-foreground truncate mb-2">{name}</h4>

      {/* Next step */}
      {nextTask ? (
        <div className="flex items-center gap-1.5 text-xs text-primary bg-primary/5 rounded-md px-2 py-1.5 mb-auto">
          <ArrowRight className="w-3 h-3 flex-shrink-0" />
          <span className="truncate font-medium">{nextTask}</span>
        </div>
      ) : (
        <div className="mb-auto" />
      )}

      {/* Footer: Last touch + Tasks */}
      <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 pt-2 border-t border-border/30">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span className="truncate">{formattedLastTouch}</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckSquare className="w-3 h-3" />
          <span>{openTaskCount}</span>
        </div>
      </div>
    </div>
  );
}
