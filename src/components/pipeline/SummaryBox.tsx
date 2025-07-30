import { PipelineStats } from '@/types/pipeline';
import { TrendingUp, TrendingDown, Clock, Share, Star, Gem, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface SummaryBoxProps {
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

export function SummaryBox({ stats }: SummaryBoxProps) {
  return (
    <Card className="bg-white/15 dark:bg-slate-800/25 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Pipeline Summary</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {statConfigs.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="text-center">
            <div className={`text-2xl font-bold ${color}`}>
              {stats[key as keyof PipelineStats]}
            </div>
            <div className="flex items-center justify-center gap-1 mt-1">
              <Icon className={`h-3 w-3 ${color}`} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}