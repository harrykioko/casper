import { AlertTriangle, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { usePriorityItems, PriorityType } from '@/hooks/usePriorityItems';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardPrioritySectionProps {
  onCompanyClick: (companyId: string, entityType: 'portfolio' | 'pipeline') => void;
}

const priorityConfig: Record<PriorityType, { icon: typeof AlertTriangle; color: string; bgColor: string }> = {
  overdue: {
    icon: AlertTriangle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
  due_today: {
    icon: Clock,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  stale: {
    icon: AlertCircle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
};

export function DashboardPrioritySection({ onCompanyClick }: DashboardPrioritySectionProps) {
  const { priorityItems, loading } = usePriorityItems();

  if (loading) {
    return (
      <section className="bg-muted/40 rounded-xl border border-border/40 p-5">
        <h3 className="text-lg font-semibold text-foreground mb-4">Priority Items</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  if (priorityItems.length === 0) {
    return (
      <section className="bg-muted/40 rounded-xl border border-border/40 p-5">
        <h3 className="text-lg font-semibold text-foreground mb-4">Priority Items</h3>
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <CheckCircle2 className="w-5 h-5 mr-2" />
          <span className="text-sm">All caught up! No priority items.</span>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-muted/40 rounded-xl border border-border/40 p-5">
      <h3 className="text-lg font-semibold text-foreground mb-4">Priority Items</h3>
      <div className="space-y-2">
        {priorityItems.map((item) => {
          const config = priorityConfig[item.type];
          const Icon = config.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onCompanyClick(item.companyId, item.entityType)}
              className="w-full flex items-center gap-4 p-3 rounded-lg bg-card/60 border border-border/30 hover:bg-card/80 hover:border-border/50 transition-all duration-150 text-left group"
            >
              {/* Icon */}
              <div className={`w-9 h-9 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4.5 h-4.5 ${config.color}`} />
              </div>
              
              {/* Company logo */}
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border flex items-center justify-center overflow-hidden flex-shrink-0">
                {item.companyLogo ? (
                  <img src={item.companyLogo} alt={item.companyName} className="max-w-full max-h-full object-contain p-1" />
                ) : (
                  <span className="text-sm font-medium text-muted-foreground">
                    {item.companyName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-foreground">{item.companyName}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${config.bgColor} ${config.color}`}>
                    {item.title}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{item.description}</p>
              </div>
              
              {/* Timestamp */}
              {item.timestamp && (
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
