import { useState } from 'react';
import { MessageSquare, Mail, Calendar, Loader2 } from 'lucide-react';
import { GlassPanel, GlassPanelHeader } from '@/components/ui/glass-panel';
import { PipelineCompanyDetail } from '@/types/pipelineExtended';
import { useCompanyLinkedCommunications, LinkedCommunication } from '@/hooks/useCompanyLinkedCommunications';
import { GlassSubcard } from '@/components/ui/glass-panel';
import { useGlobalInboxDrawer } from '@/contexts/GlobalInboxDrawerContext';
import { useInboxItems } from '@/hooks/useInboxItems';
import { useTasks } from '@/hooks/useTasks';
import { usePipeline } from '@/hooks/usePipeline';
import { useAuth } from '@/contexts/AuthContext';
import { fetchInboxItemById } from '@/lib/inbox/fetchInboxItemById';
import { copyInboxAttachmentToPipeline } from '@/lib/inbox/copyAttachmentToCompany';
import { AddTaskDialog } from '@/components/modals/AddTaskDialog';
import { LinkCompanyModal } from '@/components/inbox/LinkCompanyModal';
import { SaveAttachmentsModal } from '@/components/inbox/SaveAttachmentsModal';
import type { InboxItem, TaskPrefillOptions } from '@/types/inbox';
import type { StructuredSuggestion } from '@/types/inboxSuggestions';
import type { InboxAttachment } from '@/hooks/useInboxAttachments';
import { toast } from 'sonner';

interface CommsTabProps {
  company: PipelineCompanyDetail;
}

export function CommsTab({ company }: CommsTabProps) {
  const { linkedCommunications, loading } = useCompanyLinkedCommunications(company.primary_domain, company.id);
  const { openDrawer } = useGlobalInboxDrawer();
  const { markAsRead, markComplete, archive, snooze, linkCompany, unlinkCompany } = useInboxItems();
  const { createTask } = useTasks();
  const { createCompany: createPipelineCompany } = usePipeline();
  const { user } = useAuth();

  // State for loading individual email
  const [loadingEmailId, setLoadingEmailId] = useState<string | null>(null);

  // Task creation state
  const [taskPrefill, setTaskPrefill] = useState<TaskPrefillOptions | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

  // Link Company modal state
  const [linkCompanyItem, setLinkCompanyItem] = useState<InboxItem | null>(null);

  // Save Attachments modal state
  const [saveAttachmentsItem, setSaveAttachmentsItem] = useState<InboxItem | null>(null);

  const events = linkedCommunications.filter(c => c.type === 'event');
  const emails = linkedCommunications.filter(c => c.type === 'email');
  const hasContent = linkedCommunications.length > 0;

  // Handlers for the inbox drawer
  const handleCreateTask = (item: InboxItem, suggestionTitle?: string) => {
    setTaskPrefill({
      content: suggestionTitle || item.subject,
      description: item.preview || undefined,
      companyName: item.relatedCompanyName || company.company_name,
      companyId: item.relatedCompanyId || company.id,
      companyType: 'pipeline',
      sourceInboxItemId: item.id,
    });
    setIsTaskDialogOpen(true);
  };

  const handleMarkComplete = (id: string) => {
    markComplete(id);
  };

  const handleArchive = (id: string) => {
    archive(id);
  };

  const handleSnooze = (id: string, until: Date) => {
    snooze(id, until);
  };

  const handleAddNote = (item: InboxItem) => {
    toast.info("Add note feature coming soon");
  };

  const handleLinkCompany = (item: InboxItem) => {
    setLinkCompanyItem(item);
  };

  const handleSaveAttachments = (item: InboxItem) => {
    setSaveAttachmentsItem(item);
  };

  const handleSaveAttachmentToCompany = async (item: InboxItem, attachment: InboxAttachment) => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    const targetCompanyId = item.relatedCompanyId || company.id;
    const targetCompanyName = item.relatedCompanyName || company.company_name;

    const result = await copyInboxAttachmentToPipeline(
      attachment,
      targetCompanyId,
      user.id
    );
    if (result.success) {
      toast.success(`Saved "${attachment.filename}" to ${targetCompanyName}`);
    } else {
      toast.error(result.error || "Failed to save attachment");
    }
  };

  const handleApproveSuggestion = async (item: InboxItem, suggestion: StructuredSuggestion) => {
    switch (suggestion.type) {
      case "LINK_COMPANY": {
        if (suggestion.company_id) {
          linkCompany(item.id, suggestion.company_id, suggestion.company_name || null);
          toast.success(`Linked to ${suggestion.company_name || "company"}`);
        } else {
          setLinkCompanyItem(item);
        }
        break;
      }
      case "CREATE_PIPELINE_COMPANY": {
        const companyName = suggestion.company_name || item.senderName;
        try {
          const newCompany = await createPipelineCompany({
            company_name: companyName,
            current_round: "unknown" as any,
            website: item.senderEmail ? item.senderEmail.split("@")[1] : undefined,
          });
          if (newCompany?.id) {
            linkCompany(item.id, newCompany.id, companyName);
          }
          toast.success(`${companyName} added to pipeline`);
        } catch {
          toast.error("Failed to create pipeline company");
        }
        break;
      }
      case "CREATE_FOLLOW_UP_TASK":
      case "CREATE_PERSONAL_TASK":
      case "CREATE_INTRO_TASK": {
        setTaskPrefill({
          content: suggestion.title,
          description: item.preview || undefined,
          companyId: suggestion.company_id || item.relatedCompanyId || company.id,
          companyType: suggestion.company_type || 'pipeline',
          companyName: suggestion.company_name || item.relatedCompanyName || company.company_name,
          sourceInboxItemId: item.id,
        });
        setIsTaskDialogOpen(true);
        break;
      }
      default: {
        handleCreateTask(item, suggestion.title);
        break;
      }
    }
  };

  const handleCompanyLinked = (companyId: string, companyName: string, companyType: 'pipeline' | 'portfolio', companyLogoUrl?: string | null) => {
    if (linkCompanyItem) {
      linkCompany(linkCompanyItem.id, companyId, companyName, companyType, companyLogoUrl);
      setLinkCompanyItem(null);
    }
  };

  const handleEmailClick = async (email: LinkedCommunication) => {
    if (!email.emailData?.id) {
      toast.error("Could not load email details");
      return;
    }

    setLoadingEmailId(email.id);

    try {
      // Fetch full inbox item data
      const fullItem = await fetchInboxItemById(email.emailData.id);
      
      if (!fullItem) {
        toast.error("Could not load email details");
        return;
      }

      if (!fullItem.isRead) {
        markAsRead(fullItem.id);
      }

      openDrawer(fullItem, {
        onCreateTask: handleCreateTask,
        onMarkComplete: handleMarkComplete,
        onArchive: handleArchive,
        onSnooze: handleSnooze,
        onAddNote: handleAddNote,
        onLinkCompany: handleLinkCompany,
        onSaveAttachments: handleSaveAttachments,
        onApproveSuggestion: handleApproveSuggestion,
        onSaveAttachmentToCompany: handleSaveAttachmentToCompany,
        onUnlinkCompany: unlinkCompany,
      });
    } finally {
      setLoadingEmailId(null);
    }
  };

  if (!company.primary_domain) {
    return (
      <GlassPanel>
        <GlassPanelHeader title="Communications" />
        <div className="p-4">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground mb-1">
              No domain configured
            </p>
            <p className="text-xs text-muted-foreground">
              Add a website to the company to see linked emails and meetings.
            </p>
          </div>
        </div>
      </GlassPanel>
    );
  }

  if (loading) {
    return (
      <GlassPanel>
        <GlassPanelHeader title="Communications" />
        <div className="p-4">
          <p className="text-sm text-muted-foreground text-center py-8">
            Loading communications...
          </p>
        </div>
      </GlassPanel>
    );
  }

  if (!hasContent) {
    return (
      <GlassPanel>
        <GlassPanelHeader title="Communications" />
        <div className="p-4">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground mb-1">
              No communications found
            </p>
            <p className="text-xs text-muted-foreground">
              Emails and calendar events with {company.primary_domain} will appear here.
            </p>
          </div>
        </div>
      </GlassPanel>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {events.length > 0 && (
          <GlassPanel>
            <GlassPanelHeader title={`Meetings (${events.length})`} />
            <div className="p-4 space-y-2">
              {events.map((event) => (
                <GlassSubcard key={event.id} className="flex items-start gap-3 p-3">
                  <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-1">{event.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{event.subtitle}</p>
                  </div>
                </GlassSubcard>
              ))}
            </div>
          </GlassPanel>
        )}

        {emails.length > 0 && (
          <GlassPanel>
            <GlassPanelHeader title={`Emails (${emails.length})`} />
            <div className="p-4 space-y-2">
              {emails.map((email) => (
                <GlassSubcard 
                  key={email.id} 
                  className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleEmailClick(email)}
                >
                  {loadingEmailId === email.id ? (
                    <Loader2 className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-1">{email.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{email.subtitle}</p>
                  </div>
                </GlassSubcard>
              ))}
            </div>
          </GlassPanel>
        )}
      </div>

      {/* Task Creation Dialog */}
      <AddTaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        onAddTask={(taskData) => createTask(taskData)}
        prefill={taskPrefill || undefined}
      />

      {/* Link Company Modal */}
      {linkCompanyItem && (
        <LinkCompanyModal
          open={!!linkCompanyItem}
          onOpenChange={(open) => !open && setLinkCompanyItem(null)}
          inboxItem={linkCompanyItem}
          onLinked={handleCompanyLinked}
        />
      )}

      {/* Save Attachments Modal */}
      {saveAttachmentsItem && (
        <SaveAttachmentsModal
          open={!!saveAttachmentsItem}
          onOpenChange={(open) => !open && setSaveAttachmentsItem(null)}
          inboxItemId={saveAttachmentsItem.id}
          linkedCompanyId={saveAttachmentsItem.relatedCompanyId || company.id}
          linkedCompanyName={saveAttachmentsItem.relatedCompanyName || company.company_name}
          linkedCompanyType="pipeline"
          onLinkCompany={(companyId, companyName) => {
            linkCompany(saveAttachmentsItem.id, companyId, companyName);
          }}
        />
      )}
    </>
  );
}
