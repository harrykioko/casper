import { TrendingUp, ArrowRight, Star } from 'lucide-react';
import { useDashboardPipelineFocus } from '@/hooks/useDashboardPipelineFocus';
import { DashboardTile } from './DashboardTile';
import { CompanyGridCard } from './CompanyGridCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface PipelineGridTileProps {
  onCompanyClick: (companyId: string) => void;
}

export function PipelineGridTile({ onCompanyClick }: PipelineGridTileProps) {
  const { companies, loading } = useDashboardPipelineFocus();

  if (loading) {
    return (
      <DashboardTile title="Pipeline Focus" icon={TrendingUp} colSpan={12}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[180px] w-full rounded-xl" />
          ))}
        </div>
      </DashboardTile>
    );
  }

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <Star className="w-10 h-10 mb-3" />
      <span className="text-sm font-medium mb-1">No pipeline focus items</span>
      <span className="text-xs mb-4">Mark deals as "top of mind" to see them here</span>
      <Button asChild variant="outline" size="sm">
        <Link to="/pipeline">Go to Pipeline</Link>
      </Button>
    </div>
  );

  return (
    <DashboardTile 
      title="Pipeline Focus" 
      icon={TrendingUp} 
      colSpan={12}
      isEmpty={companies.length === 0}
      emptyState={emptyState}
      action={
        companies.length > 0 ? (
          <Button asChild variant="ghost" size="sm" className="text-xs h-7 gap-1">
            <Link to="/pipeline">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </Button>
        ) : null
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {companies.slice(0, 8).map((company) => (
          <CompanyGridCard
            key={company.id}
            type="pipeline"
            name={company.company_name}
            logoUrl={company.logo_url}
            status={company.status}
            lastTouch={company.last_interaction_at}
            openTaskCount={company.open_task_count}
            nextTask={company.next_task}
            onClick={() => onCompanyClick(company.id)}
          />
        ))}
      </div>
    </DashboardTile>
  );
}
