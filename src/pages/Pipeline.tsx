import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PipelineViewMode, PipelineFilters, PipelineCompany } from '@/types/pipeline';
import { usePipeline } from '@/hooks/usePipeline';
import { NewPipelineInput } from '@/components/pipeline/NewPipelineInput';
import { PipelineToolbar } from '@/components/pipeline/PipelineToolbar';
import { PipelineSummary } from '@/components/pipeline/PipelineSummary';
import { ActiveDealsSidebar } from '@/components/pipeline/ActiveDealsSidebar';
import { PipelineBoard } from '@/components/pipeline/PipelineBoard';
import { PipelineDetailModal } from '@/components/pipeline/PipelineDetailModal';
import { DashboardLoading } from '@/components/dashboard/DashboardLoading';

export default function Pipeline() {
  const { companies, loading, getStats } = usePipeline();
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

  const handleStatusChange = (companyId: string, newStatus: string) => {
    // Optimistic updates are handled by the usePipeline hook
  };

  if (loading) {
    return <DashboardLoading />;
  }

  const activeDeals = companies.filter(c => c.status === 'active');
  const stats = getStats();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-screen flex flex-col bg-gradient-to-br from-background to-muted"
    >
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Pipeline</h1>
            <p className="text-muted-foreground">Track and manage your deal flow</p>
          </div>

          <NewPipelineInput />
          <PipelineSummary stats={stats} />
          <PipelineToolbar
            filters={filters}
            onFiltersChange={setFilters}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <PipelineBoard
          companies={companies}
          viewMode={viewMode}
          filters={filters}
          onCardClick={setSelectedCompany}
          onStatusChange={handleStatusChange}
        />
        
        <ActiveDealsSidebar
          activeDeals={activeDeals}
          onCardClick={setSelectedCompany}
        />
      </div>

      {/* Detail Modal */}
      <PipelineDetailModal
        company={selectedCompany}
        isOpen={!!selectedCompany}
        onClose={() => setSelectedCompany(null)}
      />
    </motion.div>
  );
}