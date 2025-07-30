import { PipelineStats, PipelineStatus } from '@/types/pipeline';
import { MetricTile } from '@/components/pipeline/MetricTile';
import { STATUS_META } from '@/lib/constants';

interface SummaryBoxProps {
  stats: PipelineStats;
  filterStatus?: PipelineStatus | null;
  setFilterStatus?: (status: PipelineStatus | null) => void;
  lastUpdated?: string;
  totalActiveRaise?: number;
}

export function SummaryBox({ 
  stats, 
  filterStatus, 
  setFilterStatus, 
  lastUpdated = 'now',
  totalActiveRaise = 0 
}: SummaryBoxProps) {
  const handleTileClick = (status: string) => {
    if (!setFilterStatus) return;
    
    const newStatus = filterStatus === status ? null : status as PipelineStatus;
    setFilterStatus(newStatus);
  };

  return (
    <div className="glass bg-gradient-to-br from-white/25 via-white/10 to-white/0 dark:from-slate-700/40 dark:via-slate-800/30 dark:to-slate-900/10 rounded-2xl shadow-[0_8px_28px_-6px_rgba(0,0,0,0.25)] p-6 space-y-6 max-w-xs w-full">
      {/* Hero tile */}
      <MetricTile
        label="Total"
        value={stats.total}
        color={STATUS_META.total.color}
        icon={STATUS_META.total.icon}
        size="lg"
        selected={false}
      />

      {/* 3 × 2 grid for remaining six */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: 'active', meta: STATUS_META.active },
          { key: 'passed', meta: STATUS_META.passed },
          { key: 'to_share', meta: STATUS_META.to_share },
          { key: 'interesting', meta: STATUS_META.interesting },
          { key: 'pearls', meta: STATUS_META.pearls },
          { key: 'new', meta: STATUS_META.new },
        ].map(({ key, meta }) => (
          <MetricTile
            key={key}
            label={meta.label}
            value={stats[key as keyof PipelineStats]}
            color={meta.color}
            icon={meta.icon}
            selected={filterStatus === key}
            onClick={() => handleTileClick(key)}
          />
        ))}
      </div>

      {/* Caption */}
      <div className="text-xs text-muted-foreground pt-2 border-t border-white/10">
        Last updated {lastUpdated} • {Intl.NumberFormat('en', { 
          style: 'currency', 
          currency: 'USD', 
          notation: 'compact' 
        }).format(totalActiveRaise)} in Active Deals
      </div>
    </div>
  );
}