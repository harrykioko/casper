import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CompanyTile } from './CompanyTile';
import { useDashboardPortfolioCompanies } from '@/hooks/useDashboardPortfolioCompanies';

interface DashboardPortfolioSectionProps {
  onCompanyClick: (companyId: string) => void;
}

export function DashboardPortfolioSection({ onCompanyClick }: DashboardPortfolioSectionProps) {
  const { companies, loading } = useDashboardPortfolioCompanies();

  if (loading) {
    return (
      <section className="bg-muted/30 rounded-2xl p-5 my-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">Portfolio</h3>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="min-w-[200px] h-[140px] rounded-xl flex-shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  if (companies.length === 0) {
    return (
      <section className="bg-muted/30 rounded-2xl p-5 my-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">Portfolio</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 px-4 rounded-xl border border-dashed border-border/50 bg-card/40">
          <Briefcase className="w-8 h-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground mb-3">No portfolio companies yet.</p>
          <Button variant="outline" size="sm" asChild>
            <Link to="/portfolio">Go to Portfolio</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-muted/30 rounded-2xl p-5 my-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">Portfolio</h3>
        <Link
          to="/portfolio"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted snap-x snap-mandatory">
        {companies.map((company) => (
          <div key={company.id} className="snap-start">
            <CompanyTile
              type="portfolio"
              name={company.name}
              logoUrl={company.logo_url}
              status={company.status}
              lastTouch={company.last_interaction_at}
              openTaskCount={company.open_task_count}
              onClick={() => onCompanyClick(company.id)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
