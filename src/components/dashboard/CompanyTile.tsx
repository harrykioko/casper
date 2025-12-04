import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CompanyTileProps {
  type: 'portfolio' | 'pipeline';
  name: string;
  logoUrl?: string | null;
  status?: string;
  lastTouch?: string | null;
  openTaskCount?: number;
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

export function CompanyTile({
  type,
  name,
  logoUrl,
  status,
  lastTouch,
  openTaskCount = 0,
  onClick,
}: CompanyTileProps) {
  const formattedLastTouch = lastTouch
    ? formatDistanceToNow(new Date(lastTouch), { addSuffix: true })
    : 'No interactions yet';

  const statusColorClass = status ? statusColors[status] || 'bg-muted text-muted-foreground' : '';

  return (
    <Card
      className="min-w-[180px] max-w-[200px] cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg bg-card/50 backdrop-blur-sm border-border/50 flex-shrink-0"
      onClick={onClick}
    >
      <CardContent className="p-3">
        {/* Top row: Logo and status */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-800 border flex items-center justify-center overflow-hidden p-1 flex-shrink-0">
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
          {status && (
            <Badge variant="secondary" className={`text-[10px] px-1.5 py-0.5 ${statusColorClass}`}>
              {status.replace('_', ' ')}
            </Badge>
          )}
        </div>

        {/* Company name */}
        <h4 className="font-medium text-sm text-foreground truncate mb-2">{name}</h4>

        {/* Bottom row: Last touch and tasks */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1 truncate">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{formattedLastTouch}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <CheckSquare className="w-3 h-3" />
            <span>{openTaskCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
