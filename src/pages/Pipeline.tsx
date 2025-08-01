import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PipelineViewMode, PipelineFilters, PipelineCompany, PipelineStatus } from '@/types/pipeline';
import { usePipeline } from '@/hooks/usePipeline';
import { NewPipelineInput } from '@/components/pipeline/NewPipelineInput';
import { PipelineToolbar } from '@/components/pipeline/PipelineToolbar';
import { SummaryBox } from '@/components/pipeline/SummaryBox';
import { ActiveDealsSidebar } from '@/components/pipeline/ActiveDealsSidebar';
import { PipelineBoard } from '@/components/pipeline/PipelineBoard';
import { PipelineDetailModal } from '@/components/pipeline/PipelineDetailModal';
import { PipelineLayout } from '@/components/pipeline/PipelineLayout';
import { DashboardLoading } from '@/components/dashboard/DashboardLoading';

export default function Pipeline() {
  const { companies, loading, getStats, updateCompany } = usePipeline();
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
  const [filterStatus, setFilterStatus] = useState<PipelineStatus | null>(null);

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

  const handleStatusChange = async (companyId: string, newStatus: string) => {
    try {
      await updateCompany(companyId, { status: newStatus as PipelineStatus });
    } catch (error) {
      console.error('Failed to update company status:', error);
    }
  };

  if (loading) {
    return <DashboardLoading />;
  }

  const activeDeals = companies.filter(c => c.status === 'active');
  const stats = getStats();
  const totalActiveRaise = activeDeals.reduce((sum, deal) => sum + (deal.raise_amount_usd || 0), 0);
  const lastUpdated = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

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
          onStatusChange={handleStatusChange}
        />
      </div>
    </>
  );

  const sidebarContent = (
    <>
      <SummaryBox 
        stats={stats} 
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        lastUpdated={lastUpdated}
        totalActiveRaise={totalActiveRaise}
      />
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
      <div className="flex flex-1 min-h-0">
        {/* Desktop Layout */}
        <div className="hidden lg:flex w-full">
          <PipelineLayout 
            board={<div className="p-6">{boardContent}</div>} 
            sidebar={sidebarContent} 
          />
        </div>
        
        {/* Mobile Layout */}
        <div className="lg:hidden w-full p-6 space-y-6">
          {boardContent}
          <div className="space-y-6">
            {sidebarContent}
          </div>
        </div>
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