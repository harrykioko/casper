import { AlertTriangle, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { usePriorityItems, PriorityType } from '@/hooks/usePriorityItems';
import { GlassPanel, GlassPanelHeader, GlassSubcard } from '@/components/ui/glass-panel';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardPrioritySectionProps {
  onCompanyClick: (companyId: string, entityType: 'portfolio' | 'pipeline') => void;
}

const priorityConfig: Record<PriorityType, { icon: typeof AlertTriangle; color: string; bgColor: string; label: string }> = {
  overdue: {
    icon: AlertTriangle,
    color: 'text-status-danger',
    bgColor: 'bg-status-danger/10',
    label: 'Overdue',
  },
  due_today: {
    icon: Clock,
    color: 'text-status-warning',
    bgColor: 'bg-status-warning/10',
    label: 'Due Today',
  },
  stale: {
    icon: AlertCircle,
    color: 'text-status-warning',
    bgColor: 'bg-status-warning/10',
    label: 'Needs Attention',
  },
};

export function DashboardPrioritySection({ onCompanyClick }: DashboardPrioritySectionProps) {
  const { priorityItems, loading } = usePriorityItems();

  if (loading) {
    return (
      <GlassPanel className="h-full">
        <GlassPanelHeader title="Priority Items" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </GlassPanel>
    );
  }

  if (priorityItems.length === 0) {
    return (
      <GlassPanel className="h-full">
        <GlassPanelHeader title="Priority Items" />
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-status-active/10 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6 text-status-active" />
          </div>
          <p className="text-sm text-muted-foreground">All caught up!</p>
          <p className="text-xs text-muted-foreground/70 mt-1">No priority items right now.</p>
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="h-full">
      <GlassPanelHeader title="Priority Items" />
      <div className="space-y-3">
        {priorityItems.map((item) => {
          const config = priorityConfig[item.type];
          const Icon = config.icon;
          
          return (
            <GlassSubcard
              key={item.id}
              onClick={() => onCompanyClick(item.companyId, item.entityType)}
              className="group"
            >
              <div className="flex items-center gap-3">
                {/* Status icon */}
                <div className={`w-9 h-9 rounded-xl ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                
                {/* Company logo */}
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-border/50 flex items-center justify-center overflow-hidden flex-shrink-0">
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
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm text-foreground truncate">{item.companyName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.color} font-medium`}>
                      {config.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                </div>
                
                {/* Timestamp */}
                {item.timestamp && (
                  <span className="text-xs text-muted-foreground/70 flex-shrink-0 hidden sm:block">
                    {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                  </span>
                )}
              </div>
            </GlassSubcard>
          );
        })}
      </div>
    </GlassPanel>
  );
}
