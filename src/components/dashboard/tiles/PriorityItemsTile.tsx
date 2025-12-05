import { AlertTriangle, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { usePriorityItems, PriorityType } from '@/hooks/usePriorityItems';
import { DashboardTile } from './DashboardTile';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PriorityItemsTileProps {
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

export function PriorityItemsTile({ onCompanyClick }: PriorityItemsTileProps) {
  const { priorityItems, loading } = usePriorityItems();

  if (loading) {
    return (
      <DashboardTile title="Priority Items" icon={AlertTriangle} colSpan={4}>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </DashboardTile>
    );
  }

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
      <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-500" />
      <span className="text-sm font-medium">All caught up!</span>
      <span className="text-xs">No priority items</span>
    </div>
  );

  return (
    <DashboardTile 
      title="Priority Items" 
      icon={AlertTriangle} 
      colSpan={4}
      isEmpty={priorityItems.length === 0}
      emptyState={emptyState}
    >
      <ScrollArea className="h-[220px]">
        <div className="space-y-2 pr-2">
          {priorityItems.map((item) => {
            const config = priorityConfig[item.type];
            const Icon = config.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => onCompanyClick(item.companyId, item.entityType)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors duration-150 text-left group"
              >
                {/* Icon */}
                <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground truncate">{item.companyName}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${config.bgColor} ${config.color} font-medium`}>
                      {item.title}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </DashboardTile>
  );
}
