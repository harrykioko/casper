import { PipelineStats } from '@/types/pipeline';
import { TrendingUp, TrendingDown, Clock, Share, Star, Gem, Plus } from 'lucide-react';

interface PipelineSummaryProps {
  stats: PipelineStats;
}

const statConfigs = [
  { key: 'total', label: 'Total', icon: TrendingUp, color: 'text-foreground' },
  { key: 'active', label: 'Active', icon: TrendingUp, color: 'text-emerald-500' },
  { key: 'passed', label: 'Passed', icon: TrendingDown, color: 'text-rose-500' },
  { key: 'to_share', label: 'To Share', icon: Share, color: 'text-amber-500' },
  { key: 'interesting', label: 'Interesting', icon: Star, color: 'text-sky-500' },
  { key: 'pearls', label: 'Pearls', icon: Gem, color: 'text-purple-500' },
  { key: 'new', label: 'New', icon: Plus, color: 'text-slate-500' },
] as const;

export function PipelineSummary({ stats }: PipelineSummaryProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {statConfigs.map(({ key, label, icon: Icon, color }) => (
        <div
          key={key}
          className="bg-white/15 dark:bg-slate-800/30 backdrop-blur-lg rounded-2xl p-4 border border-white/20 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold transition-all duration-300 ${color}`}>
                {stats[key as keyof PipelineStats]}
              </p>
            </div>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      ))}
    </div>
  );
}