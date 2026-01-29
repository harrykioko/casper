import { PipelineCompanyDetail, PipelineInteraction } from '@/types/pipelineExtended';
import { PipelineAttachment } from '@/hooks/usePipelineAttachments';
import { LinkedCommunication } from '@/hooks/useCompanyLinkedCommunications';
import { MomentumPanel } from '../overview/MomentumPanel';
import { DealSignals } from '../overview/DealSignals';
import { DealRoomTab } from '@/pages/PipelineCompanyDetail';

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
  onCreateTask,
  onViewAllTasks,
  onNavigateTab,
}: OverviewTabProps) {
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

  return (
    <div className="space-y-6">
      {/* Primary focus: Momentum */}
      <MomentumPanel
        tasks={tasks}
        nextSteps={company.next_steps}
        onCreateTask={onCreateTask}
        onViewAllTasks={onViewAllTasks}
      />

      {/* Compressed signals - only renders if data exists */}
      <DealSignals
        recentNote={recentNote}
        recentFile={recentFile}
        recentComm={recentComm}
        lastCompletedTask={lastCompletedTask}
        onNavigate={onNavigateTab}
      />
    </div>
  );
}
