import { useState, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { PipelineCompany, PipelineViewMode, PipelineFilters, PipelineCardAttention } from '@/types/pipeline';
import { PipelineKanbanView } from './PipelineKanbanView';
import { PipelineListView } from './PipelineListView';
import { PipelineGridView } from './PipelineGridView';
import { PipelineCard } from './PipelineCard';
import { usePipeline } from '@/hooks/usePipeline';
import { useToast } from '@/hooks/use-toast';
import { PipelineTask, computeCardAttention } from '@/lib/pipeline/pipelineAttentionHelpers';

interface PipelineBoardProps {
  companies: PipelineCompany[];
  viewMode: PipelineViewMode;
  filters: PipelineFilters;
  onCardClick: (company: PipelineCompany) => void;
  onStatusChange: (companyId: string, newStatus: string) => void;
  allTasks?: PipelineTask[];
  onAddTask?: (company: PipelineCompany) => void;
  onLogNote?: (company: PipelineCompany) => void;
}

export function PipelineBoard({ 
  companies, 
  viewMode, 
  filters, 
  onCardClick, 
  onStatusChange,
  allTasks = [],
  onAddTask,
  onLogNote,
}: PipelineBoardProps) {
  const [activeCard, setActiveCard] = useState<PipelineCompany | null>(null);
  const { updateCompany } = usePipeline();
  const { toast } = useToast();

  // Compute attention map for all companies
  const attentionMap = useMemo(() => {
    const map = new Map<string, PipelineCardAttention>();
    for (const company of companies) {
      const attention = computeCardAttention(company, allTasks);
      map.set(company.id, attention);
    }
    return map;
  }, [companies, allTasks]);

  // Filter companies based on filters
  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      const matchesSearch = !filters.search || 
        company.company_name.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesRound = filters.rounds.length === 0 || 
        filters.rounds.includes(company.current_round);
      
      const matchesSector = filters.sectors.length === 0 || 
        (company.sector && filters.sectors.includes(company.sector));

      // New attention-based filters
      const attention = attentionMap.get(company.id);
      
      const matchesNeedsAttention = !filters.needsAttention || 
        (attention?.needsAttention ?? false);
      
      const matchesTopOfMind = !filters.topOfMindOnly || 
        company.is_top_of_mind;
      
      const matchesStale = !filters.staleOnly || 
        (attention?.isStale ?? false);

      return matchesSearch && matchesRound && matchesSector && 
             matchesNeedsAttention && matchesTopOfMind && matchesStale;
    });
  }, [companies, filters, attentionMap]);

  // Exclude active deals from board view
  const boardCompanies = filteredCompanies.filter(c => c.status !== 'active');

  const handleDragStart = (event: DragStartEvent) => {
    const company = companies.find(c => c.id === event.active.id);
    setActiveCard(company || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const companyId = active.id as string;
    const newStatus = over.id as string;

    // Handle dropping to active sidebar
    if (newStatus === 'active-sidebar') {
      const company = companies.find(c => c.id === companyId);
      if (company && !company.close_date) {
        // Show modal to set close date
        toast({
          title: "Close date required",
          description: "Active deals must have a close date. Please edit the deal to set one.",
          variant: "destructive",
        });
        return;
      }
      
      try {
        await updateCompany(companyId, { status: 'active' });
        onStatusChange(companyId, 'active');
        
        toast({
          title: "Success",
          description: `${company?.company_name} moved to Active Deals`,
        });
        
        // Analytics
        if ((window as any).gtag) {
          (window as any).gtag('event', 'pipeline_status_change', {
            id: companyId,
            from: companies.find(c => c.id === companyId)?.status,
            to: 'active'
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update company status",
          variant: "destructive",
        });
      }
      return;
    }

    // Handle dropping to different status columns
    const company = companies.find(c => c.id === companyId);
    if (company && company.status !== newStatus) {
      try {
        await updateCompany(companyId, { status: newStatus as any });
        onStatusChange(companyId, newStatus);
        
        toast({
          title: "Success",
          description: `${company?.company_name} moved to ${newStatus.replace('_', ' ')}`,
        });
        
        // Analytics
        if ((window as any).gtag) {
          (window as any).gtag('event', 'pipeline_status_change', {
            id: companyId,
            from: company.status,
            to: newStatus
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update company status",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex-1">
        {viewMode === 'kanban' && (
          <PipelineKanbanView 
            companies={boardCompanies} 
            onCardClick={onCardClick}
            attentionMap={attentionMap}
            allTasks={allTasks}
            onAddTask={onAddTask}
            onLogNote={onLogNote}
          />
        )}
        {viewMode === 'list' && (
          <PipelineListView 
            companies={boardCompanies} 
            onCardClick={onCardClick}
            attentionMap={attentionMap}
            onAddTask={onAddTask}
            onLogNote={onLogNote}
          />
        )}
        {viewMode === 'grid' && (
          <PipelineGridView 
            companies={boardCompanies} 
            onCardClick={onCardClick}
            attentionMap={attentionMap}
            onAddTask={onAddTask}
            onLogNote={onLogNote}
          />
        )}
      </div>

      <DragOverlay>
        {activeCard ? (
          <PipelineCard
            company={activeCard}
            onClick={() => {}}
            isDragging
            attention={attentionMap.get(activeCard.id)}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
