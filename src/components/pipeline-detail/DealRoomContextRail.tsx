import { PipelineCompanyDetail, PipelineInteraction, PipelineTimelineEvent } from '@/types/pipelineExtended';
import { RelationshipSummary } from './shared/RelationshipSummary';
import { NextActionsCard } from './shared/NextActionsCard';
import { ActivityFeed } from './shared/ActivityFeed';

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
}

export function DealRoomContextRail({ 
  company, 
  tasks, 
  interactions, 
  timelineEvents 
}: DealRoomContextRailProps) {
  const openTasks = tasks.filter(t => !t.completed);
  const notesCount = interactions.filter(i => 
    ['note', 'call', 'meeting', 'update'].includes(i.interaction_type)
  ).length;
  const filesCount = 0; // Will be implemented
  const commsCount = 0; // Placeholder

  return (
    <div className="space-y-4">
      <RelationshipSummary
        openTasksCount={openTasks.length}
        notesCount={notesCount}
        filesCount={filesCount}
        commsCount={commsCount}
        lastActivityAt={company.last_interaction_at}
      />

      <NextActionsCard
        tasks={openTasks}
        nextSteps={company.next_steps}
      />

      <ActivityFeed
        events={timelineEvents}
      />
    </div>
  );
}
