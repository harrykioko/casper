import { Button } from '@/components/ui/button';
import { CompanyStatus } from '@/types/portfolio';

interface PortfolioFiltersProps {
  activeFilter: CompanyStatus | 'all';
  onFilterChange: (filter: CompanyStatus | 'all') => void;
}

const filters: { value: CompanyStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'watching', label: 'Watching' },
  { value: 'exited', label: 'Exited' },
  { value: 'archived', label: 'Archived' },
];

export function PortfolioFilters({ activeFilter, onFilterChange }: PortfolioFiltersProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={activeFilter === filter.value ? 'secondary' : 'ghost'}
          size="sm"
          className="text-xs h-7"
          onClick={() => onFilterChange(filter.value)}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}
