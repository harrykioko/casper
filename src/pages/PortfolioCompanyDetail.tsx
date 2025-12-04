import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useCompany } from '@/hooks/useCompany';
import { useCompanyContacts } from '@/hooks/useCompanyContacts';
import { useCompanyInteractions } from '@/hooks/useCompanyInteractions';
import { useCompanyTasks } from '@/hooks/useCompanyTasks';
import { useCompanyTimeline } from '@/hooks/useCompanyTimeline';
import { CompanyHeader } from '@/components/portfolio/CompanyHeader';
import { CompanyFoundersPanel } from '@/components/portfolio/CompanyFoundersPanel';
import { CompanyTasksSection } from '@/components/portfolio/CompanyTasksSection';
import { CompanyInteractionsSection } from '@/components/portfolio/CompanyInteractionsSection';
import { CompanyTimeline } from '@/components/portfolio/CompanyTimeline';
import { AddCompanyModal } from '@/components/portfolio/AddCompanyModal';
import { DashboardLoading } from '@/components/dashboard/DashboardLoading';
import { CompanyStatus, FounderInput } from '@/types/portfolio';

export default function PortfolioCompanyDetail() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [editModalOpen, setEditModalOpen] = useState(false);

  const {
    company,
    contacts,
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-6 lg:p-8"
    >
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => navigate('/portfolio')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Portfolio
      </Button>

      {/* Header */}
      <CompanyHeader
        company={{ ...company, open_task_count: tasks.filter((t) => !t.completed).length }}
        onEdit={() => setEditModalOpen(true)}
      />

      {/* Content Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Left column - Founders + Tasks */}
        <div className="lg:col-span-1 space-y-6">
          <CompanyFoundersPanel founders={founders} />
          <CompanyTasksSection
            tasks={tasks}
            loading={tasksLoading}
            onCreateTask={createTask}
            onToggleComplete={toggleComplete}
            onDeleteTask={deleteTask}
          />
        </div>

        {/* Middle column - Interactions */}
        <div className="lg:col-span-1">
          <CompanyInteractionsSection
            interactions={interactions}
            loading={interactionsLoading}
            onCreateInteraction={createInteraction}
            onDeleteInteraction={deleteInteraction}
          />
        </div>

        {/* Right column - Timeline */}
        <div className="lg:col-span-1">
          <CompanyTimeline
            events={timeline}
            loading={interactionsLoading || tasksLoading}
          />
        </div>
      </div>

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
