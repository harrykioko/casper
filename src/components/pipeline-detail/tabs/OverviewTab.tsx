import { useState } from 'react';
import { PipelineCompanyDetail, PipelineInteraction } from '@/types/pipelineExtended';
import { PipelineAttachment } from '@/hooks/usePipelineAttachments';
import { LinkedCommunication } from '@/hooks/useCompanyLinkedCommunications';
import { MomentumPanel } from '../overview/MomentumPanel';
import { DealSignals } from '../overview/DealSignals';
import { CompanyContextCard } from '../overview/CompanyContextCard';
import { HarmonicMatchModal } from '../overview/HarmonicMatchModal';
import { DealRoomTab } from '@/pages/PipelineCompanyDetail';
import { HarmonicEnrichment, HarmonicCandidate, EnrichmentMode } from '@/types/enrichment';
import { toast } from 'sonner';

interface EnrichOptions {
  website_domain?: string;
  linkedin_url?: string;
  query_name?: string;
}

interface PipelineTask {
  id: string;
  content: string;
  completed: boolean;
  completed_at?: string | null;
  scheduled_for?: string | null;
  priority?: string | null;
}

interface OverviewTabProps {
  company: PipelineCompanyDetail;
  tasks: PipelineTask[];
  interactions: PipelineInteraction[];
  attachments: PipelineAttachment[];
  linkedCommunications?: LinkedCommunication[];
  enrichment: HarmonicEnrichment | null;
  enrichmentLoading: boolean;
  enriching: boolean;
  onEnrich: (mode: EnrichmentMode, options?: EnrichOptions) => Promise<{ enrichment: HarmonicEnrichment | null; notFound: boolean }>;
  onSearchCandidates: (queryName: string) => Promise<HarmonicCandidate[]>;
  onRefreshEnrichment: () => Promise<{ enrichment: HarmonicEnrichment | null; notFound: boolean }>;
  onRefetch: () => void;
  onCreateTask: (content: string, options?: { scheduled_for?: string; priority?: string }) => Promise<any>;
  onViewAllTasks: () => void;
  onViewAllNotes: () => void;
  onViewAllFiles: () => void;
  onNavigateTab: (tab: DealRoomTab) => void;
}

export function OverviewTab({
  company,
  tasks,
  interactions,
  attachments,
  linkedCommunications = [],
  enrichment,
  enrichmentLoading,
  enriching,
  onEnrich,
  onSearchCandidates,
  onRefreshEnrichment,
  onCreateTask,
  onViewAllTasks,
  onNavigateTab,
}: OverviewTabProps) {
  const [matchModalOpen, setMatchModalOpen] = useState(false);

  // Get most recent note (note, call, meeting, update types)
  const recentNote = interactions
    .filter(i => ['note', 'call', 'meeting', 'update'].includes(i.interaction_type))
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())[0] || null;

  // Get most recent file
  const recentFile = attachments
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] || null;

  // Get most recent communication
  const recentComm = linkedCommunications
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] || null;

  // Get last completed task
  const lastCompletedTask = tasks
    .filter(t => t.completed)
    .sort((a, b) => {
      const aTime = new Date(a.completed_at || a.scheduled_for || 0).getTime();
      const bTime = new Date(b.completed_at || b.scheduled_for || 0).getTime();
      return bTime - aTime;
    })[0] || null;

  const handleEnrich = async () => {
    const domain = company.primary_domain || (company.website ? new URL(company.website.startsWith('http') ? company.website : `https://${company.website}`).hostname.replace('www.', '') : null);
    if (domain) {
      const result = await onEnrich('enrich_by_domain', { website_domain: domain });
      // If no match found by domain, auto-open manual match modal
      if (result.notFound) {
        toast.info('No automatic match found. Search for the company manually.');
        setMatchModalOpen(true);
      }
    } else {
      setMatchModalOpen(true);
    }
  };

  const handleSelectCandidate = async (candidate: HarmonicCandidate) => {
    if (candidate.domain) {
      await onEnrich('enrich_by_domain', { website_domain: candidate.domain });
    } else if (candidate.linkedin_url) {
      await onEnrich('enrich_by_linkedin', { linkedin_url: candidate.linkedin_url });
    }
  };

  return (
    <div className="space-y-6">
      {/* Primary focus: Momentum */}
      <MomentumPanel
        tasks={tasks}
        nextSteps={company.next_steps}
        onCreateTask={onCreateTask}
        onViewAllTasks={onViewAllTasks}
      />

      {/* Company context from Harmonic */}
      <CompanyContextCard
        company={company}
        enrichment={enrichment}
        loading={enrichmentLoading}
        enriching={enriching}
        onEnrich={handleEnrich}
        onRefresh={onRefreshEnrichment}
        onChangeMatch={() => setMatchModalOpen(true)}
      />

      {/* Compressed signals - only renders if data exists */}
      <DealSignals
        recentNote={recentNote}
        recentFile={recentFile}
        recentComm={recentComm}
        lastCompletedTask={lastCompletedTask}
        onNavigate={onNavigateTab}
      />

      {/* Harmonic match modal */}
      <HarmonicMatchModal
        open={matchModalOpen}
        onOpenChange={setMatchModalOpen}
        companyName={company.company_name}
        onSearch={onSearchCandidates}
        onSelectCandidate={handleSelectCandidate}
        searching={enriching}
      />
    </div>
  );
}
