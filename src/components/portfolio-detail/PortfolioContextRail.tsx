import { RelationshipSummary } from '@/components/pipeline-detail/shared/RelationshipSummary';
import { PortfolioNextActionsCard } from './PortfolioNextActionsCard';
import { PortfolioActivityFeed } from './PortfolioActivityFeed';
import { CompanyTask } from '@/hooks/useCompanyTasks';
import { TimelineEvent } from '@/types/portfolio';

interface PortfolioContextRailProps {
  openTasksCount: number;
  notesCount: number;
  lastActivityAt?: string | null;
  tasks: CompanyTask[];
  timeline: TimelineEvent[];
  onToggleComplete: (taskId: string) => Promise<boolean>;
  onViewFullTimeline?: () => void;
}

export function PortfolioContextRail({
  openTasksCount,
  notesCount,
  lastActivityAt,
  tasks,
  timeline,
  onToggleComplete,
  onViewFullTimeline,
}: PortfolioContextRailProps) {
  return (
    <div className="space-y-4">
      <RelationshipSummary
        openTasksCount={openTasksCount}
        notesCount={notesCount}
        filesCount={0}
        commsCount={0}
        lastActivityAt={lastActivityAt}
      />
      
      <PortfolioNextActionsCard 
        tasks={tasks} 
        onToggleComplete={onToggleComplete}
      />
      
      <PortfolioActivityFeed 
        events={timeline} 
        onViewFullTimeline={onViewFullTimeline}
      />
    </div>
  );
}
