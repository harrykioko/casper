import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { GlassPanel, GlassPanelHeader } from '@/components/ui/glass-panel';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompanyAttention } from '@/hooks/useCompanyAttention';
import { CompanyAttentionGrid } from './CompanyAttentionGrid';
import { CompanyAttentionState, AttentionStatus } from '@/types/attention';
import { cn } from '@/lib/utils';

interface CompaniesCommandPaneProps {
  onCompanyClick?: (id: string, type: 'portfolio' | 'pipeline') => void;
  onCreateTask?: (companyId: string, companyType: 'portfolio' | 'pipeline') => void;
}

type EntityFilter = 'all' | 'portfolio' | 'pipeline';
type StatusFilter = 'all' | AttentionStatus;

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  variant?: 'entity' | 'status';
  statusColor?: AttentionStatus;
}

function FilterChip({ label, active, onClick, variant = 'entity', statusColor }: FilterChipProps) {
  const statusDotColors: Record<AttentionStatus, string> = {
    red: 'bg-red-500',
    yellow: 'bg-amber-400',
    green: 'bg-emerald-500',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "text-xs px-3 py-1 rounded-full font-medium transition-colors flex items-center gap-1.5",
        active
          ? "bg-primary/10 text-primary"
          : "bg-muted/50 text-muted-foreground hover:bg-muted/70"
      )}
    >
      {variant === 'status' && statusColor && (
        <span className={cn("w-2 h-2 rounded-full", statusDotColors[statusColor])} />
      )}
      {label}
    </button>
  );
}

export function CompaniesCommandPane({ onCompanyClick, onCreateTask }: CompaniesCommandPaneProps) {
  const { companies, isLoading } = useCompanyAttention();
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Filter companies
  const filtered = companies
    .filter(c => entityFilter === 'all' || c.entityType === entityFilter)
    .filter(c => statusFilter === 'all' || c.status === statusFilter);

  // Count by status for badges
  const statusCounts = {
    red: companies.filter(c => c.status === 'red').length,
    yellow: companies.filter(c => c.status === 'yellow').length,
    green: companies.filter(c => c.status === 'green').length,
  };

  const handleCompanyClick = (company: CompanyAttentionState) => {
    onCompanyClick?.(company.companyId, company.entityType);
  };

  const handleCreateTask = (company: CompanyAttentionState) => {
    onCreateTask?.(company.companyId, company.entityType);
  };

  return (
    <GlassPanel className="h-full min-h-[400px]">
      <GlassPanelHeader 
        title="Companies"
        action={
          <span className="text-xs text-muted-foreground">
            At a glance: what needs your attention
          </span>
        }
      />
      
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-4 px-1">
        {/* Entity filters */}
        <FilterChip 
          label="All" 
          active={entityFilter === 'all'} 
          onClick={() => setEntityFilter('all')} 
        />
        <FilterChip 
          label="Portfolio" 
          active={entityFilter === 'portfolio'} 
          onClick={() => setEntityFilter('portfolio')} 
        />
        <FilterChip 
          label="Pipeline" 
          active={entityFilter === 'pipeline'} 
          onClick={() => setEntityFilter('pipeline')} 
        />
        
        <div className="w-px h-5 bg-border/50 mx-1 self-center" />
        
        {/* Status filters */}
        <FilterChip 
          label={`Red (${statusCounts.red})`}
          active={statusFilter === 'red'} 
          onClick={() => setStatusFilter(statusFilter === 'red' ? 'all' : 'red')}
          variant="status"
          statusColor="red"
        />
        <FilterChip 
          label={`Yellow (${statusCounts.yellow})`}
          active={statusFilter === 'yellow'} 
          onClick={() => setStatusFilter(statusFilter === 'yellow' ? 'all' : 'yellow')}
          variant="status"
          statusColor="yellow"
        />
        <FilterChip 
          label={`Green (${statusCounts.green})`}
          active={statusFilter === 'green'} 
          onClick={() => setStatusFilter(statusFilter === 'green' ? 'all' : 'green')}
          variant="status"
          statusColor="green"
        />
      </div>
      
      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4 p-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="w-20 h-20 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <div className="text-center">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-sm font-medium mb-1">
              {companies.length === 0 
                ? 'No companies yet' 
                : 'No companies match filters'}
            </p>
            <p className="text-xs text-muted-foreground/70">
              {companies.length === 0
                ? 'Add portfolio or pipeline companies to see them here'
                : 'Try adjusting your filters'}
            </p>
          </div>
        </div>
      ) : (
        <CompanyAttentionGrid
          companies={filtered}
          onCompanyClick={handleCompanyClick}
          onCreateTask={onCreateTask ? handleCreateTask : undefined}
          className="p-1"
        />
      )}
    </GlassPanel>
  );
}
