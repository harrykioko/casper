import { Link } from 'react-router-dom';
import { ArrowRight, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CompanyTile } from './CompanyTile';
import { useDashboardPipelineFocus } from '@/hooks/useDashboardPipelineFocus';

interface DashboardPipelineFocusSectionProps {
  onCompanyClick: (companyId: string) => void;
}

export function DashboardPipelineFocusSection({ onCompanyClick }: DashboardPipelineFocusSectionProps) {
  const { companies, loading } = useDashboardPipelineFocus();

  if (loading) {
    return (
      <section className="bg-muted/30 rounded-2xl p-6 border border-border/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Pipeline Focus</h3>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="min-w-[220px] h-[160px] rounded-xl flex-shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  if (companies.length === 0) {
    return (
      <section className="bg-muted/30 rounded-2xl p-6 border border-border/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Pipeline Focus</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-10 px-4 rounded-xl border border-dashed border-border/50 bg-card/40">
          <Target className="w-10 h-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground text-center mb-4">
            No top-of-mind companies.<br />
            Pin from Pipeline to surface them here.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link to="/pipeline">Go to Pipeline</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-muted/30 rounded-2xl p-6 border border-border/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Pipeline Focus</h3>
        <Link
          to="/pipeline"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted snap-x snap-mandatory">
        {companies.map((company, index) => (
          <div 
            key={company.id} 
            className="snap-start animate-in fade-in slide-in-from-bottom-2"
            style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
          >
            <CompanyTile
              type="pipeline"
              name={company.company_name}
              status={company.status}
              lastTouch={company.updated_at}
              nextTask={company.next_steps}
              onClick={() => onCompanyClick(company.id)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
