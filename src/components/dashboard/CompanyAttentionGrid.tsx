import { CompanyAttentionState } from '@/types/attention';
import { AttentionTileHoverCard } from './AttentionTileHoverCard';
import { cn } from '@/lib/utils';

interface CompanyAttentionGridProps {
  companies: CompanyAttentionState[];
  onCompanyClick: (company: CompanyAttentionState) => void;
  onCreateTask?: (company: CompanyAttentionState) => void;
  className?: string;
}

export function CompanyAttentionGrid({ 
  companies, 
  onCompanyClick, 
  onCreateTask,
  className 
}: CompanyAttentionGridProps) {
  // Sort by attention score (highest first), then by name
  const sorted = [...companies].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.name.localeCompare(b.name);
  });

  if (sorted.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      "grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4",
      className
    )}>
      {sorted.map(company => (
        <AttentionTileHoverCard
          key={`${company.entityType}-${company.companyId}`}
          company={company}
          onClick={onCompanyClick}
          onCreateTask={onCreateTask}
        />
      ))}
    </div>
  );
}
