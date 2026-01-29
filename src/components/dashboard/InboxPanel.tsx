import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Inbox, Check, Archive, Mail, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ActionPanel,
  ActionPanelHeader,
  ActionPanelListArea,
  ActionPanelRow,
  ActionPanelFooter,
  CountBadge,
} from "@/components/ui/action-panel";
import { AddTaskDialog } from "@/components/modals/AddTaskDialog";
import { LinkCompanyModal } from "@/components/inbox/LinkCompanyModal";
import { SaveAttachmentsModal } from "@/components/inbox/SaveAttachmentsModal";
import { TaskPrefillOptions, InboxItem } from "@/types/inbox";
import { useInboxItems } from "@/hooks/useInboxItems";
import { useTasks } from "@/hooks/useTasks";
import { usePipeline } from "@/hooks/usePipeline";
import { useAuth } from "@/contexts/AuthContext";
import { useGlobalInboxDrawer } from "@/contexts/GlobalInboxDrawerContext";
import { copyInboxAttachmentToPipeline } from "@/lib/inbox/copyAttachmentToCompany";
import type { StructuredSuggestion } from "@/types/inboxSuggestions";
import type { InboxAttachment } from "@/hooks/useInboxAttachments";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface InboxPanelProps {
  onOpenTaskCreate: (options: TaskPrefillOptions) => void;
}

export function InboxPanel({ onOpenTaskCreate }: InboxPanelProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { inboxItems, isLoading, markAsRead, markComplete, archive, snooze, linkCompany, unlinkCompany } = useInboxItems();
  const { createTask } = useTasks();
  const { createCompany: createPipelineCompany } = usePipeline();
  const { openDrawer } = useGlobalInboxDrawer();

  // Task creation state
  const [taskPrefill, setTaskPrefill] = useState<TaskPrefillOptions | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

  // Link Company modal state
  const [linkCompanyItem, setLinkCompanyItem] = useState<InboxItem | null>(null);

  // Save Attachments modal state
  const [saveAttachmentsItem, setSaveAttachmentsItem] = useState<InboxItem | null>(null);

  const openInboxDetail = (item: InboxItem) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }
    openDrawer(item, {
      onCreateTask: handleCreateTaskFromEmail,
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

  const handleCreateTaskFromEmail = (item: InboxItem, suggestionTitle?: string) => {
    setTaskPrefill({
      content: suggestionTitle || item.subject,
      description: item.preview || undefined,
      companyName: item.relatedCompanyName,
      sourceInboxItemId: item.id,
    });
    setIsTaskDialogOpen(true);
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

    if (item.relatedCompanyId) {
      const result = await copyInboxAttachmentToPipeline(
        attachment,
        item.relatedCompanyId,
        user.id
      );
      if (result.success) {
        toast.success(`Saved "${attachment.filename}" to ${item.relatedCompanyName || "company"}`);
      } else {
        toast.error(result.error || "Failed to save attachment");
      }
    } else {
      setSaveAttachmentsItem(item);
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
          companyId: suggestion.company_id || item.relatedCompanyId || undefined,
          companyType: suggestion.company_type || undefined,
          companyName: suggestion.company_name || item.relatedCompanyName || undefined,
          sourceInboxItemId: item.id,
        });
        setIsTaskDialogOpen(true);
        break;
      }
      default: {
        handleCreateTaskFromEmail(item, suggestion.title);
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

  const unreadCount = inboxItems.filter((item) => !item.isRead).length;

  return (
    <>
      <ActionPanel accentColor="sky" className="h-full">
        <ActionPanelHeader
          icon={<Inbox className="h-4 w-4" />}
          title="Inbox"
          subtitle={`${unreadCount} new messages`}
          badge={unreadCount > 0 ? <CountBadge count={unreadCount} label="unread" accentColor="sky" /> : undefined}
          accentColor="sky"
        />

        {isLoading ? (
          <ActionPanelListArea accentColor="sky" className="flex items-center justify-center">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Loader2 className="w-6 h-6 text-sky-500 animate-spin mb-2" />
              <p className="text-xs text-slate-400 dark:text-slate-500">Loading inbox...</p>
            </div>
          </ActionPanelListArea>
        ) : inboxItems.length === 0 ? (
          <ActionPanelListArea accentColor="sky" className="flex items-center justify-center">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center mb-3">
                <Mail className="w-6 h-6 text-sky-500" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Inbox zero!</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">No items to review.</p>
            </div>
          </ActionPanelListArea>
        ) : (
          <ActionPanelListArea accentColor="sky" className="overflow-y-auto max-h-[280px]">
            {inboxItems.slice(0, 4).map((item, index) => {
              const isLast = index === Math.min(inboxItems.length, 4) - 1;
              // Use display fields with fallbacks
              const displayName = item.displayFromName || item.senderName;
              const displaySubject = item.displaySubject || item.subject;
              const displayPreview = item.summary || item.displaySnippet || item.preview;
              const initial = displayName.charAt(0).toUpperCase();

              return (
                <ActionPanelRow
                  key={item.id}
                  onClick={() => openInboxDetail(item)}
                  isLast={isLast}
                >
                  {/* Left content */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Avatar - smaller */}
                    <div className="w-7 h-7 rounded-full bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-sky-600 dark:text-sky-300">
                        {initial}
                      </span>
                    </div>

                    {/* Content - combined sender + subject line */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className={cn(
                            "text-sm truncate",
                            !item.isRead
                              ? "font-semibold text-slate-700 dark:text-slate-200"
                              : "font-medium text-slate-600 dark:text-slate-300"
                          )}
                        >
                          {displayName}
                        </span>
                        {item.isForwarded && (
                          <Badge variant="outline" className="text-[8px] h-3.5 px-1 font-medium text-muted-foreground border-muted-foreground/30">
                            Fwd
                          </Badge>
                        )}
                        <span className="text-slate-300 dark:text-slate-600 flex-shrink-0">·</span>
                        <span className="text-sm text-slate-600 dark:text-slate-300 truncate">
                          {displaySubject}
                        </span>
                        {!item.isRead && (
                          <div className="w-1.5 h-1.5 rounded-full bg-sky-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{displayPreview}</p>
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Quick Actions (appear on hover) */}
                    <div className="hidden group-hover:flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-slate-500 hover:text-emerald-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkComplete(item.id);
                        }}
                        title="Mark complete"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchive(item.id);
                        }}
                        title="Archive"
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Timestamp (visible when not hovering) */}
                    <span className="text-[10px] text-slate-400 group-hover:hidden min-w-[40px] text-right">
                      {formatDistanceToNow(new Date(item.receivedAt), { addSuffix: true }).replace(' ago', '').replace('about ', '')}
                    </span>
                  </div>
                </ActionPanelRow>
              );
            })}
          </ActionPanelListArea>
        )}

        {inboxItems.length > 0 && (
          <ActionPanelFooter>
            <button 
              onClick={() => navigate('/inbox')}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              View all messages
            </button>
            <button 
              onClick={() => navigate('/inbox')}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-slate-900/5 dark:bg-slate-50/5 text-slate-500 dark:text-slate-300 hover:bg-slate-900/10 dark:hover:bg-slate-50/10 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Open Inbox
            </button>
          </ActionPanelFooter>
        )}
      </ActionPanel>

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
          linkedCompanyId={saveAttachmentsItem.relatedCompanyId}
          linkedCompanyName={saveAttachmentsItem.relatedCompanyName}
          linkedCompanyType={saveAttachmentsItem.relatedCompanyId ? 'pipeline' : undefined}
          onLinkCompany={(companyId, companyName) => {
            linkCompany(saveAttachmentsItem.id, companyId, companyName);
          }}
        />
      )}
    </>
  );
}
