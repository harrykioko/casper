import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { PipelineViewMode, PipelineFilters, PipelineCompany } from '@/types/pipeline';
import { usePipeline } from '@/hooks/usePipeline';
import { useToast } from '@/hooks/use-toast';
import { NewPipelineInput } from '@/components/pipeline/NewPipelineInput';
import { PipelineToolbar } from '@/components/pipeline/PipelineToolbar';
import { SummaryBox } from '@/components/pipeline/SummaryBox';
import { ActiveDealsSidebar } from '@/components/pipeline/ActiveDealsSidebar';
import { PipelineBoard } from '@/components/pipeline/PipelineBoard';
import { PipelineCard } from '@/components/pipeline/PipelineCard';
import { PipelineDetailModal } from '@/components/pipeline/PipelineDetailModal';
import { PipelineLayout } from '@/components/pipeline/PipelineLayout';
import { DashboardLoading } from '@/components/dashboard/DashboardLoading';

export default function Pipeline() {
  const { companies, loading, getStats, updateCompany } = usePipeline();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<PipelineViewMode>(() => {
    const saved = localStorage.getItem('casper.pipeline.view');
    return (saved as PipelineViewMode) || 'kanban';
  });
  const [filters, setFilters] = useState<PipelineFilters>({
    search: '',
    rounds: [],
    sectors: [],
  });
  const [selectedCompany, setSelectedCompany] = useState<PipelineCompany | null>(null);
  const [activeCard, setActiveCard] = useState<PipelineCompany | null>(null);

  // Persist view mode to localStorage
  useEffect(() => {
    localStorage.setItem('casper.pipeline.view', viewMode);
    
    // Analytics
    if ((window as any).gtag) {
      (window as any).gtag('event', 'pipeline_view_toggle', {
        view_type: viewMode
      });
    }
  }, [viewMode]);

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

  const handleStatusChange = (companyId: string, newStatus: string) => {
    // Optimistic updates are handled by the usePipeline hook
  };

  if (loading) {
    return <DashboardLoading />;
  }

  const activeDeals = companies.filter(c => c.status === 'active');
  const stats = getStats();

  const boardContent = (
    <>
      <NewPipelineInput />
      <PipelineToolbar
        filters={filters}
        onFiltersChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      <div className="overflow-x-auto">
        <PipelineBoard
          companies={companies}
          viewMode={viewMode}
          filters={filters}
          onCardClick={setSelectedCompany}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />
      </div>
    </>
  );

  const sidebarContent = (
    <>
      <SummaryBox stats={stats} />
      <ActiveDealsSidebar
        activeDeals={activeDeals}
        onCardClick={setSelectedCompany}
      />
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-gradient-to-br from-background to-muted"
    >
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="p-6">
          <div>
            <h1 className="text-3xl font-bold">Pipeline</h1>
            <p className="text-muted-foreground">Track and manage your deal flow</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="p-6">
          {/* Desktop Layout */}
          <div className="hidden lg:block">
            <PipelineLayout board={boardContent} sidebar={sidebarContent} />
          </div>
          
          {/* Mobile Layout */}
          <div className="lg:hidden space-y-6">
            {boardContent}
            <div className="space-y-6">
              {sidebarContent}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeCard ? (
            <PipelineCard
              company={activeCard}
              onClick={() => {}}
              isDragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Detail Modal */}
      <PipelineDetailModal
        company={selectedCompany}
        isOpen={!!selectedCompany}
        onClose={() => setSelectedCompany(null)}
      />
    </motion.div>
  );
}