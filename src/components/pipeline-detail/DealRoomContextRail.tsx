import { PipelineCompanyDetail, PipelineInteraction, PipelineTimelineEvent } from '@/types/pipelineExtended';
import { PipelineAttachment } from '@/hooks/usePipelineAttachments';
import { LinkedCommunication } from '@/hooks/useCompanyLinkedCommunications';
import { StatusSnapshot } from './overview/StatusSnapshot';
import { ActivityFeed } from './shared/ActivityFeed';
import { differenceInDays } from 'date-fns';
import { HarmonicEnrichment } from '@/types/enrichment';

interface Task {
  id: string;
  content: string;
  completed: boolean;
  scheduled_for?: string | null;
  priority?: string | null;
}

interface DealRoomContextRailProps {
  company: PipelineCompanyDetail;
  tasks: Task[];
  interactions: PipelineInteraction[];
  timelineEvents: PipelineTimelineEvent[];
  attachments: PipelineAttachment[];
  linkedCommunications: LinkedCommunication[];
  enrichment?: HarmonicEnrichment | null;
  onViewFullTimeline?: () => void;
}

export function DealRoomContextRail({ 
  company, 
  tasks, 
  interactions, 
  timelineEvents,
  attachments,
  enrichment,
  onViewFullTimeline,
}: DealRoomContextRailProps) {
  const openTasks = tasks.filter(t => !t.completed);
  const notesCount = interactions.filter(i => 
    ['note', 'call', 'meeting', 'update'].includes(i.interaction_type)
  ).length;
  const filesCount = attachments.length;

  // Calculate days since last activity
  const daysSinceLastActivity = company.last_interaction_at
    ? differenceInDays(new Date(), new Date(company.last_interaction_at))
    : null;

  return (
    <div className="space-y-4">
      <StatusSnapshot
        openTasksCount={openTasks.length}
        notesCount={notesCount}
        filesCount={filesCount}
        daysSinceLastActivity={daysSinceLastActivity}
        enrichment={enrichment}
      />

      <ActivityFeed
        events={timelineEvents}
        onViewFullTimeline={onViewFullTimeline}
        maxItems={5}
      />
    </div>
  );
}
