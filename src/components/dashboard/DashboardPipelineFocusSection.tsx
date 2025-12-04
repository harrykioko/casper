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
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Pipeline Focus</h3>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="min-w-[180px] h-[120px] rounded-lg flex-shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  if (companies.length === 0) {
    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Pipeline Focus</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 px-4 rounded-lg border border-dashed border-border/50 bg-muted/20">
          <Target className="w-8 h-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground text-center mb-3">
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
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Pipeline Focus</h3>
        <Link
          to="/pipeline"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted snap-x snap-mandatory">
        {companies.map((company) => (
          <div key={company.id} className="snap-start">
            <CompanyTile
              type="pipeline"
              name={company.company_name}
              status={company.status}
              lastTouch={company.updated_at}
              onClick={() => onCompanyClick(company.id)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
