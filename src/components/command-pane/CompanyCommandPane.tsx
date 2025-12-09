import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet';
import { CompanyCommandHeader } from './CompanyCommandHeader';
import { CompanyCommandSummary } from './CompanyCommandSummary';
import { CompanyCommandContacts } from './CompanyCommandContacts';
import { CompanyCommandTasks } from './CompanyCommandTasks';
import { CompanyCommandNotes } from './CompanyCommandNotes';
import { CompanyCommandTimeline } from './CompanyCommandTimeline';
import { CompanyCommandQuickActions } from './CompanyCommandQuickActions';
import { CompanyCommandCommunications } from './CompanyCommandCommunications';
import { CompanyRichNotes } from './CompanyRichNotes';
import { PipelineCommandHeader } from './PipelineCommandHeader';
import { PipelineCommandSummary } from './PipelineCommandSummary';
import { EventDetailsModal } from '@/components/dashboard/EventDetailsModal';
import { InboxDetailDrawer } from '@/components/dashboard/InboxDetailDrawer';
import { useCompany } from '@/hooks/useCompany';
import { useCompanyContacts } from '@/hooks/useCompanyContacts';
import { useCompanyInteractions } from '@/hooks/useCompanyInteractions';
import { useCompanyTasks } from '@/hooks/useCompanyTasks';
import { useCompanyTimeline } from '@/hooks/useCompanyTimeline';
import { usePipelineCompanyDetail } from '@/hooks/usePipelineCompanyDetail';
import { usePipelineContacts } from '@/hooks/usePipelineContacts';
import { usePipelineInteractions } from '@/hooks/usePipelineInteractions';
import { usePipelineTasks } from '@/hooks/usePipelineTasks';
import { usePipelineTimeline } from '@/hooks/usePipelineTimeline';
import { useCompanyLinkedCommunications } from '@/hooks/useCompanyLinkedCommunications';
import { useInboxItems } from '@/hooks/useInboxItems';
import { Skeleton } from '@/components/ui/skeleton';
import { differenceInDays, parseISO } from 'date-fns';
import { InboxItem } from '@/types/inbox';
import { supabase } from '@/integrations/supabase/client';

interface CompanyCommandPaneProps {
  open: boolean;
  onClose: () => void;
  entityType: 'portfolio' | 'pipeline';
  entityId: string | null;
}

function getHealthBorderColor(lastInteractionAt: string | null | undefined): string {
  if (!lastInteractionAt) return 'border-t-red-500';
  const days = differenceInDays(new Date(), parseISO(lastInteractionAt));
  if (days <= 7) return 'border-t-emerald-500';
  if (days <= 14) return 'border-t-amber-500';
  return 'border-t-red-500';
}

export function CompanyCommandPane({ open, onClose, entityType, entityId }: CompanyCommandPaneProps) {
  // Modal/drawer state for communications
  const [selectedEvent, setSelectedEvent] = useState<{
    id: string;
    title: string;
    startTime: string;
    endTime?: string;
    location?: string;
    description?: string;
    attendees?: Array<{ name: string; email?: string }>;
  } | null>(null);
  const [selectedInboxItem, setSelectedInboxItem] = useState<InboxItem | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isInboxDrawerOpen, setIsInboxDrawerOpen] = useState(false);

  // Inbox item actions
  const { markAsRead, markComplete, archive } = useInboxItems();

  // Portfolio hooks
  const { company: portfolioCompany, loading: portfolioLoading } = useCompany(
    entityType === 'portfolio' ? entityId ?? undefined : undefined
  );
  const { founders: portfolioFounders } = useCompanyContacts(
    entityType === 'portfolio' ? entityId ?? undefined : undefined
  );
  const { interactions: portfolioInteractions, createInteraction: createPortfolioInteraction, recentInteractions: portfolioRecentInteractions } = useCompanyInteractions(
    entityType === 'portfolio' ? entityId ?? undefined : undefined
  );
  const { openTasks: portfolioOpenTasks, createTask: createPortfolioTask, toggleComplete: togglePortfolioComplete, tasks: portfolioTasks } = useCompanyTasks(
    entityType === 'portfolio' ? entityId ?? undefined : undefined
  );
  const portfolioTimeline = useCompanyTimeline(portfolioInteractions, portfolioTasks);

  // Pipeline hooks
  const { company: pipelineCompany, loading: pipelineLoading, toggleTopOfMind } = usePipelineCompanyDetail(
    entityType === 'pipeline' ? entityId ?? undefined : undefined
  );
  const { founders: pipelineFounders } = usePipelineContacts(
    entityType === 'pipeline' ? entityId ?? undefined : undefined
  );
  const { interactions: pipelineInteractions, createInteraction: createPipelineInteraction, recentInteractions: pipelineRecentInteractions } = usePipelineInteractions(
    entityType === 'pipeline' ? entityId ?? undefined : undefined
  );
  const { openTasks: pipelineOpenTasks, createTask: createPipelineTask, toggleComplete: togglePipelineComplete, tasks: pipelineTasks } = usePipelineTasks(
    entityType === 'pipeline' ? entityId ?? undefined : undefined
  );
  const pipelineTimeline = usePipelineTimeline(pipelineInteractions, pipelineTasks);

  // Linked communications for both entity types
  const portfolioPrimaryDomain = entityType === 'portfolio' ? portfolioCompany?.primary_domain : undefined;
  const pipelinePrimaryDomain = entityType === 'pipeline' ? pipelineCompany?.primary_domain : undefined;
  
  const { linkedCommunications: portfolioComms, loading: portfolioCommsLoading } = useCompanyLinkedCommunications(
    portfolioPrimaryDomain
  );
  const { linkedCommunications: pipelineComms, loading: pipelineCommsLoading } = useCompanyLinkedCommunications(
    pipelinePrimaryDomain
  );

  // Handle event click - fetch full event data
  const handleEventClick = async (eventId: string) => {
    const { data: event } = await supabase
      .from('calendar_events')
      .select('id, title, start_time, end_time, location, description, attendees')
      .eq('id', eventId)
      .single();

    if (event) {
      const attendees = Array.isArray(event.attendees)
        ? (event.attendees as Array<{ name?: string; email?: string }>).map(a => ({
            name: a.name || a.email || 'Unknown',
            email: a.email,
          }))
        : [];

      setSelectedEvent({
        id: event.id,
        title: event.title,
        startTime: event.start_time,
        endTime: event.end_time || undefined,
        location: event.location || undefined,
        description: event.description || undefined,
        attendees,
      });
      setIsEventModalOpen(true);
    }
  };

  // Handle email click - fetch full inbox item data
  const handleEmailClick = async (emailId: string) => {
    const { data: email } = await supabase
      .from('inbox_items')
      .select('*')
      .eq('id', emailId)
      .single();

    if (email) {
      const inboxItem: InboxItem = {
        id: email.id,
        subject: email.subject,
        senderName: email.from_name || email.from_email,
        senderEmail: email.from_email,
        toEmail: email.to_email,
        preview: email.snippet,
        body: email.text_body,
        htmlBody: email.html_body,
        receivedAt: email.received_at,
        isRead: email.is_read,
        isResolved: email.is_resolved,
        isDeleted: email.is_deleted,
        snoozedUntil: email.snoozed_until,
        relatedCompanyId: email.related_company_id || undefined,
        relatedCompanyName: email.related_company_name || undefined,
        createdBy: email.created_by,
      };
      setSelectedInboxItem(inboxItem);
      setIsInboxDrawerOpen(true);
      
      // Mark as read when opened
      if (!email.is_read) {
        markAsRead(email.id);
      }
    }
  };

  const isLoading = entityType === 'portfolio' ? portfolioLoading : pipelineLoading;
  
  // Determine health border color based on entity type
  const lastInteraction = entityType === 'portfolio' 
    ? portfolioCompany?.last_interaction_at 
    : pipelineCompany?.last_interaction_at;
  const healthBorderColor = getHealthBorderColor(lastInteraction);
  
  // Portfolio-specific derived data
  const portfolioNextTask = portfolioOpenTasks.length > 0 ? portfolioOpenTasks[0].content : null;
  const portfolioPrimaryFounder = portfolioFounders.find(f => f.is_primary) || portfolioFounders[0];

  // Pipeline-specific derived data  
  const pipelinePrimaryFounder = pipelineFounders.find(f => f.is_primary) || pipelineFounders[0];

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent 
        side="right" 
        className={`w-full sm:w-[600px] lg:w-[680px] xl:w-[720px] p-0 bg-background/95 backdrop-blur-xl border-l overflow-hidden flex flex-col data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=open]:duration-200 border-t-4 ${healthBorderColor}`}
      >
        {isLoading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
          </div>
        ) : entityType === 'portfolio' && portfolioCompany ? (
          <>
            <SheetHeader className="p-0 sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/40">
              <CompanyCommandHeader
                company={portfolioCompany}
                onClose={onClose}
              />
            </SheetHeader>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <CompanyCommandSummary
                lastInteractionAt={portfolioCompany.last_interaction_at}
                openTaskCount={portfolioOpenTasks.length}
                status={portfolioCompany.status}
                nextTask={portfolioNextTask}
              />

              <CompanyCommandQuickActions
                companyId={portfolioCompany.id}
                primaryFounderEmail={portfolioPrimaryFounder?.email}
                onAddTask={() => {
                  const input = document.querySelector<HTMLInputElement>('[data-task-input]');
                  input?.focus();
                }}
                onAddNote={() => {
                  const textarea = document.querySelector<HTMLTextAreaElement>('[data-note-input]');
                  textarea?.focus();
                }}
              />

              {portfolioFounders.length > 0 && (
                <CompanyCommandContacts contacts={portfolioFounders} />
              )}

              <CompanyCommandTasks
                tasks={portfolioOpenTasks.slice(0, 5)}
                companyId={portfolioCompany.id}
                onCreateTask={createPortfolioTask}
                onToggleComplete={togglePortfolioComplete}
              />

              <CompanyCommandNotes
                interactions={portfolioRecentInteractions}
                companyId={portfolioCompany.id}
                onCreateInteraction={createPortfolioInteraction}
              />

              <CompanyRichNotes companyId={portfolioCompany.id} />

              <CompanyCommandCommunications
                linkedCommunications={portfolioComms}
                loading={portfolioCommsLoading}
                onEventClick={handleEventClick}
                onEmailClick={handleEmailClick}
              />

              <CompanyCommandTimeline events={portfolioTimeline.slice(0, 8)} />
            </div>
          </>
        ) : entityType === 'pipeline' && pipelineCompany ? (
          <>
            <SheetHeader className="p-0 sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/40">
              <PipelineCommandHeader
                company={pipelineCompany}
                onClose={onClose}
                onToggleTopOfMind={toggleTopOfMind}
              />
            </SheetHeader>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <PipelineCommandSummary
                lastInteractionAt={pipelineCompany.last_interaction_at}
                openTaskCount={pipelineOpenTasks.length}
                raiseAmount={pipelineCompany.raise_amount_usd}
                closeDate={pipelineCompany.close_date}
                nextSteps={pipelineCompany.next_steps}
              />

              <CompanyCommandQuickActions
                companyId={pipelineCompany.id}
                primaryFounderEmail={pipelinePrimaryFounder?.email}
                onAddTask={() => {
                  const input = document.querySelector<HTMLInputElement>('[data-task-input]');
                  input?.focus();
                }}
                onAddNote={() => {
                  const textarea = document.querySelector<HTMLTextAreaElement>('[data-note-input]');
                  textarea?.focus();
                }}
                entityType="pipeline"
              />

              {pipelineFounders.length > 0 && (
                <CompanyCommandContacts contacts={pipelineFounders} />
              )}

              <CompanyCommandTasks
                tasks={pipelineOpenTasks.slice(0, 5)}
                companyId={pipelineCompany.id}
                onCreateTask={createPipelineTask}
                onToggleComplete={togglePipelineComplete}
                entityType="pipeline"
              />

              <CompanyCommandNotes
                interactions={pipelineRecentInteractions}
                companyId={pipelineCompany.id}
                onCreateInteraction={createPipelineInteraction}
                entityType="pipeline"
              />

              <CompanyRichNotes companyId={pipelineCompany.id} />

              <CompanyCommandCommunications
                linkedCommunications={pipelineComms}
                loading={pipelineCommsLoading}
                onEventClick={handleEventClick}
                onEmailClick={handleEmailClick}
              />

              <CompanyCommandTimeline events={pipelineTimeline.slice(0, 8)} />
            </div>
          </>
        ) : (
          <div className="p-4">
            <p className="text-muted-foreground text-sm">No company selected.</p>
          </div>
        )}
      </SheetContent>

      {/* Event Details Modal */}
      <EventDetailsModal
        event={selectedEvent}
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setSelectedEvent(null);
        }}
      />

      {/* Inbox Detail Drawer */}
      <InboxDetailDrawer
        open={isInboxDrawerOpen}
        onClose={() => {
          setIsInboxDrawerOpen(false);
          setSelectedInboxItem(null);
        }}
        item={selectedInboxItem}
        onCreateTask={() => {
          // TODO: Wire up task creation from inbox item
        }}
        onMarkComplete={(id) => {
          markComplete(id);
          setIsInboxDrawerOpen(false);
          setSelectedInboxItem(null);
        }}
        onArchive={(id) => {
          archive(id);
          setIsInboxDrawerOpen(false);
          setSelectedInboxItem(null);
        }}
      />
    </Sheet>
  );
}
