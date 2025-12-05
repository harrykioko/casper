import { Link } from 'react-router-dom';
import { ArrowRight, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CompanyTile } from './CompanyTile';
import { GlassPanel, GlassPanelHeader } from '@/components/ui/glass-panel';
import { useDashboardPipelineFocus } from '@/hooks/useDashboardPipelineFocus';

interface DashboardPipelineFocusSectionProps {
  onCompanyClick: (companyId: string) => void;
}

export function DashboardPipelineFocusSection({ onCompanyClick }: DashboardPipelineFocusSectionProps) {
  const { companies, loading } = useDashboardPipelineFocus();

  if (loading) {
    return (
      <GlassPanel>
        <GlassPanelHeader title="Pipeline Focus" />
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="min-w-[220px] h-[180px] rounded-2xl flex-shrink-0" />
          ))}
        </div>
      </GlassPanel>
    );
  }

  if (companies.length === 0) {
    return (
      <GlassPanel>
        <GlassPanelHeader title="Pipeline Focus" />
        <div className="flex flex-col items-center justify-center py-12 px-4 rounded-2xl border border-dashed border-border/30 bg-white/30 dark:bg-white/[0.02]">
          <div className="w-14 h-14 rounded-2xl bg-accent-purple/10 flex items-center justify-center mb-4">
            <Target className="w-7 h-7 text-accent-purple" />
          </div>
          <p className="text-sm text-muted-foreground text-center mb-4">
            No top-of-mind companies.<br />
            Pin from Pipeline to surface them here.
          </p>
          <Button variant="outline" size="sm" className="rounded-full" asChild>
            <Link to="/pipeline">Go to Pipeline</Link>
          </Button>
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel>
      <GlassPanelHeader 
        title="Pipeline Focus" 
        action={
          <Link
            to="/pipeline"
            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        }
      />
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-2 px-2">
        {companies.map((company, index) => (
          <div 
            key={company.id} 
            className="snap-start animate-fade-in"
            style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
          >
            <CompanyTile
              type="pipeline"
              name={company.company_name}
              logoUrl={company.logo_url}
              status={company.status}
              lastTouch={company.last_interaction_at}
              nextTask={company.next_steps}
              onClick={() => onCompanyClick(company.id)}
            />
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}
