import { PipelineStats, PipelineStatus, PipelineCardAttention } from '@/types/pipeline';
import { MetricTile } from '@/components/pipeline/MetricTile';
import { STATUS_META } from '@/lib/constants';
import { useMemo } from 'react';

interface SummaryBoxProps {
  stats: PipelineStats;
  filterStatus?: PipelineStatus | null;
  setFilterStatus?: (status: PipelineStatus | null) => void;
  lastUpdated?: string;
  totalActiveRaise?: number;
  attentionMap?: Map<string, PipelineCardAttention>;
  companiesByStatus?: Map<PipelineStatus, string[]>;
}

export function SummaryBox({ 
  stats, 
  filterStatus, 
  setFilterStatus, 
  lastUpdated = 'now',
  totalActiveRaise = 0,
  attentionMap,
  companiesByStatus,
}: SummaryBoxProps) {
  const handleTileClick = (status: string) => {
    if (!setFilterStatus) return;
    
    const newStatus = filterStatus === status ? null : status as PipelineStatus;
    setFilterStatus(newStatus);
  };

  // Compute sublabels for each status
  const sublabels = useMemo(() => {
    if (!attentionMap || !companiesByStatus) return {};
    
    const labels: Record<string, string | undefined> = {};
    
    // For each status, count companies needing attention
    for (const [status, companyIds] of companiesByStatus) {
      let needsFollowUp = 0;
      let staleCount = 0;
      let closingSoon = 0;
      
      for (const id of companyIds) {
        const attention = attentionMap.get(id);
        if (!attention) continue;
        if (attention.needsAttention) needsFollowUp++;
        if (attention.isStale) staleCount++;
        if (attention.isClosingSoon) closingSoon++;
      }
      
      if (status === 'active' && needsFollowUp > 0) {
        labels.active = `${needsFollowUp} need follow-up`;
      } else if (status === 'new' && staleCount > 0) {
        labels.new = `${staleCount} stale`;
      } else if (status === 'interesting' && needsFollowUp > 0) {
        labels.interesting = `${needsFollowUp} need attention`;
      } else if (status === 'pearls' && closingSoon > 0) {
        labels.pearls = `${closingSoon} closing soon`;
      } else if (status === 'to_share' && staleCount > 0) {
        labels.to_share = `${staleCount} stale`;
      }
    }
    
    return labels;
  }, [attentionMap, companiesByStatus]);

  return (
    <div className="glass bg-gradient-to-br from-white/25 via-white/10 to-white/0 dark:from-slate-700/40 dark:via-slate-800/30 dark:to-slate-900/10 rounded-2xl shadow-[0_8px_28px_-6px_rgba(0,0,0,0.25)] p-4 space-y-4 w-full">
      {/* Hero tile */}
      <div className="w-full">
        <MetricTile
          label="Total"
          value={stats.total}
          color={STATUS_META.total.color}
          icon={STATUS_META.total.icon}
          size="lg"
          selected={false}
        />
      </div>

      {/* 2 × 3 grid for remaining six */}
      <div className="grid grid-cols-2 gap-3">
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
            sublabel={sublabels[key]}
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
