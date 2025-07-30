import { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { PipelineCompany, PipelineViewMode, PipelineFilters } from '@/types/pipeline';
import { PipelineKanbanView } from './PipelineKanbanView';
import { PipelineListView } from './PipelineListView';
import { PipelineGridView } from './PipelineGridView';

interface PipelineBoardProps {
  companies: PipelineCompany[];
  viewMode: PipelineViewMode;
  filters: PipelineFilters;
  onCardClick: (company: PipelineCompany) => void;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

export function PipelineBoard({ 
  companies, 
  viewMode, 
  filters, 
  onCardClick,
  onDragStart,
  onDragEnd
}: PipelineBoardProps) {

  // Filter companies based on filters
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = !filters.search || 
      company.company_name.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesRound = filters.rounds.length === 0 || 
      filters.rounds.includes(company.current_round);
    
    const matchesSector = filters.sectors.length === 0 || 
      (company.sector && filters.sectors.includes(company.sector));

    return matchesSearch && matchesRound && matchesSector;
  });

  // Exclude active deals from board view
  const boardCompanies = filteredCompanies.filter(c => c.status !== 'active');

  return (
    <div className="flex-1">
      {viewMode === 'kanban' && (
        <PipelineKanbanView companies={boardCompanies} onCardClick={onCardClick} />
      )}
      {viewMode === 'list' && (
        <PipelineListView companies={boardCompanies} onCardClick={onCardClick} />
      )}
      {viewMode === 'grid' && (
        <PipelineGridView companies={boardCompanies} onCardClick={onCardClick} />
      )}
    </div>
  );
}