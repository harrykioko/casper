import { useParams, Navigate } from 'react-router-dom';
import { usePipelineCompanyDetail } from '@/hooks/usePipelineCompanyDetail';
import { usePipelineTasks } from '@/hooks/usePipelineTasks';
import { usePipelineInteractions } from '@/hooks/usePipelineInteractions';
import { usePipelineTimeline } from '@/hooks/usePipelineTimeline';
import { usePipelineAttachments } from '@/hooks/usePipelineAttachments';
import { useCompanyLinkedCommunications } from '@/hooks/useCompanyLinkedCommunications';
import { DealRoomLayout } from '@/components/pipeline-detail/DealRoomLayout';
import { DealRoomHero } from '@/components/pipeline-detail/DealRoomHero';
import { DealRoomTabs } from '@/components/pipeline-detail/DealRoomTabs';
import { DealRoomContextRail } from '@/components/pipeline-detail/DealRoomContextRail';
import { OverviewTab } from '@/components/pipeline-detail/tabs/OverviewTab';
import { TasksTab } from '@/components/pipeline-detail/tabs/TasksTab';
import { NotesTab } from '@/components/pipeline-detail/tabs/NotesTab';
import { FilesTab } from '@/components/pipeline-detail/tabs/FilesTab';
import { CommsTab } from '@/components/pipeline-detail/tabs/CommsTab';
import { TimelineTab } from '@/components/pipeline-detail/tabs/TimelineTab';
import { PipelineDetailModal } from '@/components/pipeline/PipelineDetailModal';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export type DealRoomTab = 'overview' | 'tasks' | 'notes' | 'files' | 'comms' | 'timeline';

export default function PipelineCompanyDetail() {
  const { companyId } = useParams<{ companyId: string }>();
  const [activeTab, setActiveTab] = useState<DealRoomTab>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { company, loading: companyLoading, refetch: refetchCompany } = usePipelineCompanyDetail(companyId);
  const { tasks, loading: tasksLoading, createTask, updateTask, deleteTask } = usePipelineTasks(companyId);
  const { interactions, loading: interactionsLoading, createInteraction } = usePipelineInteractions(companyId);
  const { attachments, loading: attachmentsLoading } = usePipelineAttachments(companyId);
  const { linkedCommunications } = useCompanyLinkedCommunications(company?.primary_domain, companyId);
  const timelineEvents = usePipelineTimeline(interactions, tasks, linkedCommunications);

  if (!companyId) {
    return <Navigate to="/pipeline" replace />;
  }

  if (companyLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!company) {
    return <Navigate to="/pipeline" replace />;
  }

  // Calculate counts for tabs
  const openTasksCount = tasks.filter(t => !t.completed).length;
  const notesCount = interactions.filter(i => 
    ['note', 'call', 'meeting', 'update'].includes(i.interaction_type)
  ).length;
  const filesCount = attachments.length;
  const commsCount = linkedCommunications.length;

  const tabCounts = {
    tasks: openTasksCount,
    notes: notesCount,
    files: filesCount,
    comms: commsCount,
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            company={company}
            tasks={tasks}
            interactions={interactions}
            attachments={attachments}
            linkedCommunications={linkedCommunications}
            onRefetch={refetchCompany}
            onCreateTask={createTask}
            onViewAllTasks={() => setActiveTab('tasks')}
            onViewAllNotes={() => setActiveTab('notes')}
            onViewAllFiles={() => setActiveTab('files')}
            onNavigateTab={setActiveTab}
          />
        );
      case 'tasks':
        return (
          <TasksTab
            companyId={company.id}
            tasks={tasks}
            isLoading={tasksLoading}
            onCreateTask={createTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
          />
        );
      case 'notes':
        return (
          <NotesTab
            companyId={company.id}
            interactions={interactions}
            isLoading={interactionsLoading}
            onCreateInteraction={createInteraction}
          />
        );
      case 'files':
        return <FilesTab companyId={company.id} />;
      case 'comms':
        return <CommsTab company={company} />;
      case 'timeline':
        return (
          <TimelineTab
            events={timelineEvents}
            isLoading={false}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <DealRoomLayout
        hero={
          <DealRoomHero
            company={company}
            onOpenEdit={() => setIsEditModalOpen(true)}
            onRefetch={refetchCompany}
          />
        }
        tabs={
          <DealRoomTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={tabCounts}
          />
        }
        content={renderTabContent()}
        rail={
          <DealRoomContextRail
            company={company}
            tasks={tasks}
            interactions={interactions}
            timelineEvents={timelineEvents}
            attachments={attachments}
            linkedCommunications={linkedCommunications}
            onViewFullTimeline={() => setActiveTab('timeline')}
          />
        }
      />

      <PipelineDetailModal
        company={company as any}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          refetchCompany();
        }}
      />
    </>
  );
}
