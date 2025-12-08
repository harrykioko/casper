import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { GlassPanel } from '@/components/ui/glass-panel';
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

const statusDotColors: Record<AttentionStatus, string> = {
  red: 'bg-rose-400',
  yellow: 'bg-amber-300',
  green: 'bg-emerald-400',
};

function FilterChip({ label, active, onClick, variant = 'entity', statusColor }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        "transition-all duration-150",
        "border",
        active
          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent"
          : "bg-white/5 text-slate-500 dark:text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-700 dark:hover:text-slate-300"
      )}
    >
      {variant === 'status' && statusColor && (
        <span className={cn(
          "w-2 h-2 rounded-full mr-1.5",
          statusDotColors[statusColor]
        )} />
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        {/* Left: Icon chip + Title + subtitle */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-300">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold tracking-[0.14em] uppercase text-slate-500 dark:text-slate-400">
              Companies
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500">
              {companies.length} at a glance
            </div>
          </div>
        </div>

        {/* Right: Filter chips */}
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
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
          
          <div className="w-px h-4 bg-white/10 mx-1" />
          
          {/* Status filters */}
          <FilterChip 
            label={`${statusCounts.red}`}
            active={statusFilter === 'red'} 
            onClick={() => setStatusFilter(statusFilter === 'red' ? 'all' : 'red')}
            variant="status"
            statusColor="red"
          />
          <FilterChip 
            label={`${statusCounts.yellow}`}
            active={statusFilter === 'yellow'} 
            onClick={() => setStatusFilter(statusFilter === 'yellow' ? 'all' : 'yellow')}
            variant="status"
            statusColor="yellow"
          />
          <FilterChip 
            label={`${statusCounts.green}`}
            active={statusFilter === 'green'} 
            onClick={() => setStatusFilter(statusFilter === 'green' ? 'all' : 'green')}
            variant="status"
            statusColor="green"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="border-b border-white/10 mb-4" />
      
      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4 pt-3 pb-4 sm:pt-4 sm:pb-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-slate-500 dark:text-slate-400">
          <div className="text-center">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-sm font-medium mb-1">
              {companies.length === 0 
                ? 'No companies yet' 
                : 'No companies match filters'}
            </p>
            <p className="text-xs opacity-70">
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
          className="pt-3 pb-4 sm:pt-4 sm:pb-6"
        />
      )}
    </GlassPanel>
  );
}
