import { useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Mail, Calendar, Paperclip } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useCompany } from '@/hooks/useCompany';
import { useCompanyContacts } from '@/hooks/useCompanyContacts';
import { useCompanyInteractions } from '@/hooks/useCompanyInteractions';
import { useCompanyTasks } from '@/hooks/useCompanyTasks';
import { useCompanyTimeline } from '@/hooks/useCompanyTimeline';
import { AddCompanyModal } from '@/components/portfolio/AddCompanyModal';
import { DashboardLoading } from '@/components/dashboard/DashboardLoading';
import { CompanyStatus, FounderInput, InteractionType } from '@/types/portfolio';

// Layout components
import { PortfolioCompanyLayout } from '@/components/portfolio-detail/PortfolioCompanyLayout';
import { PortfolioCompanyHero } from '@/components/portfolio-detail/PortfolioCompanyHero';
import { PortfolioModeNav, PortfolioMode } from '@/components/portfolio-detail/PortfolioModeNav';
import { PortfolioContextRail } from '@/components/portfolio-detail/PortfolioContextRail';

// Mode views
import { OverviewMode } from '@/components/portfolio-detail/modes/OverviewMode';
import { PeopleMode } from '@/components/portfolio-detail/modes/PeopleMode';
import { NotesMode } from '@/components/portfolio-detail/modes/NotesMode';
import { TasksMode } from '@/components/portfolio-detail/modes/TasksMode';
import { EmptyMode } from '@/components/portfolio-detail/modes/EmptyMode';

function usePortfolioMode(): [PortfolioMode, (mode: PortfolioMode) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = (searchParams.get('mode') as PortfolioMode) || 'overview';
  
  const setMode = useCallback((newMode: PortfolioMode) => {
    setSearchParams({ mode: newMode }, { replace: true });
  }, [setSearchParams]);
  
  return [mode, setMode];
}

export default function PortfolioCompanyDetail() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [mode, setMode] = usePortfolioMode();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [showNoteComposer, setShowNoteComposer] = useState(false);

  const {
    company,
    loading: companyLoading,
    error: companyError,
    updateCompany,
    refetch: refetchCompany,
  } = useCompany(companyId);

  const {
    founders,
    upsertFounders,
    refetch: refetchContacts,
  } = useCompanyContacts(companyId);

  const {
    interactions,
    loading: interactionsLoading,
    createInteraction,
    deleteInteraction,
  } = useCompanyInteractions(companyId);

  const {
    tasks,
    openTasks,
    loading: tasksLoading,
    createTask,
    toggleComplete,
    deleteTask,
  } = useCompanyTasks(companyId);

  const timeline = useCompanyTimeline(interactions, tasks);

  const handleEditCompany = async (data: {
    name: string;
    website_url?: string;
    logo_url?: string;
    status: CompanyStatus;
    founders: FounderInput[];
  }) => {
    await updateCompany({
      name: data.name,
      website_url: data.website_url || null,
      logo_url: data.logo_url || null,
      status: data.status,
    });

    await upsertFounders(data.founders);
    refetchCompany();
    refetchContacts();
  };

  const handleAddTask = () => {
    setMode('tasks');
  };

  const handleAddNote = () => {
    setMode('notes');
  };

  if (companyLoading) {
    return <DashboardLoading />;
  }

  if (companyError || !company) {
    return (
      <div className="min-h-screen p-6 lg:p-8 flex flex-col items-center justify-center">
        <h2 className="text-lg font-medium mb-2">Company not found</h2>
        <p className="text-sm text-muted-foreground mb-4">
          The company you're looking for doesn't exist or you don't have access.
        </p>
        <Button onClick={() => navigate('/portfolio')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Portfolio
        </Button>
      </div>
    );
  }

  const renderModeContent = () => {
    switch (mode) {
      case 'overview':
        return (
          <OverviewMode
            tasks={tasks}
            interactions={interactions}
            founders={founders}
            onModeChange={setMode}
            onAddNote={handleAddNote}
          />
        );
      
      case 'people':
        return <PeopleMode founders={founders} />;
      
      case 'notes':
        return (
          <NotesMode
            interactions={interactions}
            loading={interactionsLoading}
            onCreateInteraction={createInteraction}
            onDeleteInteraction={deleteInteraction}
          />
        );
      
      case 'tasks':
        return (
          <TasksMode
            tasks={tasks}
            loading={tasksLoading}
            onCreateTask={createTask}
            onToggleComplete={toggleComplete}
            onDeleteTask={deleteTask}
          />
        );
      
      case 'emails':
        return (
          <EmptyMode
            icon={Mail}
            title="Emails"
            description="Email threads with this company will appear here once the integration is connected."
            ctaLabel="Coming soon"
            ctaDisabled
          />
        );
      
      case 'meetings':
        return (
          <EmptyMode
            icon={Calendar}
            title="Meetings"
            description="Calendar events with this company will appear here once linked."
            ctaLabel="Coming soon"
            ctaDisabled
          />
        );
      
      case 'files':
        return (
          <EmptyMode
            icon={Paperclip}
            title="Files"
            description="Documents and attachments related to this company will be stored here."
            ctaLabel="Coming soon"
            ctaDisabled
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Back button - positioned absolutely */}
      <div className="absolute top-4 left-4 z-40">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/portfolio')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Portfolio
        </Button>
      </div>

      <PortfolioCompanyLayout
        hero={
          <PortfolioCompanyHero
            company={{ ...company, open_task_count: openTasks.length }}
            onEdit={() => setEditModalOpen(true)}
            onAddTask={handleAddTask}
            onAddNote={handleAddNote}
          />
        }
        nav={
          <PortfolioModeNav
            currentMode={mode}
            onModeChange={setMode}
            counts={{
              peopleCount: founders.length,
              notesCount: interactions.length,
              tasksCount: openTasks.length,
            }}
          />
        }
        content={renderModeContent()}
        rail={
          <PortfolioContextRail
            openTasksCount={openTasks.length}
            notesCount={interactions.length}
            lastActivityAt={company.last_interaction_at}
            tasks={tasks}
            timeline={timeline}
            onToggleComplete={toggleComplete}
            onViewFullTimeline={() => setMode('notes')}
          />
        }
      />

      {/* Edit Modal */}
      <AddCompanyModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSubmit={handleEditCompany}
        isEditing
        initialData={{
          name: company.name,
          website_url: company.website_url,
          logo_url: company.logo_url,
          status: company.status,
          founders: founders.map((f) => ({
            id: f.id,
            name: f.name,
            email: f.email || '',
            role: f.role || '',
            is_primary: f.is_primary,
          })),
        }}
      />
    </motion.div>
  );
}
