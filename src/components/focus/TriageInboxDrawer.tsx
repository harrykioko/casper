import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InboxDetailWorkspace } from "@/components/inbox/InboxDetailWorkspace";
import { TriageActionsBar } from "./TriageActionsBar";
import { AddTaskDialog } from "@/components/modals/AddTaskDialog";
import { LinkCompanyModal } from "@/components/inbox/LinkCompanyModal";
import { SaveAttachmentsModal } from "@/components/inbox/SaveAttachmentsModal";
import { CreatePipelineFromInboxModal } from "@/components/inbox/CreatePipelineFromInboxModal";
import { useInboxItems } from "@/hooks/useInboxItems";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/contexts/AuthContext";
import { copyInboxAttachmentToPipeline } from "@/lib/inbox/copyAttachmentToCompany";
import { toast } from "sonner";
import type { InboxItem, TaskPrefillOptions } from "@/types/inbox";
import type { StructuredSuggestion, CreatePipelineCompanyMetadata } from "@/types/inboxSuggestions";
import type { InboxAttachment } from "@/hooks/useInboxAttachments";

const STORAGE_KEY = "casper:triage-inbox-drawer:width";
const DEFAULT_WIDTH = 720;
const MIN_WIDTH = 600;
const MAX_WIDTH = 1200;

interface TriageInboxDrawerProps {
  open: boolean;
  onClose: () => void;
  item: InboxItem | null;
  onCreateTask: (item: InboxItem) => void;
  onMarkComplete: (id: string) => void;
  onArchive: (id: string) => void;
  // Triage actions
  onMarkTrusted: () => void;
  onSnooze: (until: Date) => void;
  onNoAction: () => void;
  showLink?: boolean;
  onLink?: () => void;
}

export function TriageInboxDrawer({
  open,
  onClose,
  item,
  onCreateTask,
  onMarkComplete,
  onArchive,
  onMarkTrusted,
  onSnooze,
  onNoAction,
  showLink = false,
  onLink,
}: TriageInboxDrawerProps) {
  const { user } = useAuth();
  const { snooze, linkCompany, unlinkCompany } = useInboxItems();
  const { createTask } = useTasks();

  const [width, setWidth] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_WIDTH;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
        return parsed;
      }
    }
    return DEFAULT_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Modal state
  const [taskPrefill, setTaskPrefill] = useState<TaskPrefillOptions | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [linkCompanyItem, setLinkCompanyItem] = useState<InboxItem | null>(null);
  const [saveAttachmentsItem, setSaveAttachmentsItem] = useState<InboxItem | null>(null);
  const [pipelineModalItem, setPipelineModalItem] = useState<{
    item: InboxItem;
    metadata: CreatePipelineCompanyMetadata;
  } | null>(null);

  // Persist width
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(width));
  }, [width]);

  // Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Resize drag
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);

      const startX = e.clientX;
      const startWidth = width;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = startX - moveEvent.clientX;
        const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth + deltaX));
        setWidth(newWidth);
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [width]
  );

  // --- Inbox action handlers ---

  const handleSnooze = useCallback(
    (id: string, until: Date) => {
      snooze(id, until);
    },
    [snooze]
  );

  const handleAddNote = useCallback((_item: InboxItem) => {
    toast.info("Add note feature coming soon");
  }, []);

  const handleLinkCompany = useCallback((inboxItem: InboxItem) => {
    setLinkCompanyItem(inboxItem);
  }, []);

  const handleSaveAttachments = useCallback((inboxItem: InboxItem) => {
    setSaveAttachmentsItem(inboxItem);
  }, []);

  const handleCreateTask = useCallback(
    (inboxItem: InboxItem, suggestionTitle?: string) => {
      setTaskPrefill({
        content: suggestionTitle || inboxItem.subject,
        description: inboxItem.preview || undefined,
        companyName: inboxItem.relatedCompanyName,
        sourceInboxItemId: inboxItem.id,
      });
      setIsTaskDialogOpen(true);
    },
    []
  );

  const handleSaveAttachmentToCompany = useCallback(
    async (inboxItem: InboxItem, attachment: InboxAttachment) => {
      if (!user) {
        toast.error("You must be logged in");
        return;
      }
      if (inboxItem.relatedCompanyId) {
        const result = await copyInboxAttachmentToPipeline(
          attachment,
          inboxItem.relatedCompanyId,
          user.id
        );
        if (result.success) {
          toast.success(`Saved "${attachment.filename}" to ${inboxItem.relatedCompanyName || "company"}`);
        } else {
          toast.error(result.error || "Failed to save attachment");
        }
      } else {
        setSaveAttachmentsItem(inboxItem);
      }
    },
    [user]
  );

  const handleApproveSuggestion = useCallback(
    async (inboxItem: InboxItem, suggestion: StructuredSuggestion) => {
      switch (suggestion.type) {
        case "LINK_COMPANY": {
          if (suggestion.company_id) {
            linkCompany(inboxItem.id, suggestion.company_id, suggestion.company_name || null);
            toast.success(`Linked to ${suggestion.company_name || "company"}`);
          } else {
            setLinkCompanyItem(inboxItem);
          }
          break;
        }
        case "CREATE_PIPELINE_COMPANY": {
          const rawMetadata = suggestion.metadata as Record<string, unknown> | undefined;
          const hasValidMetadata =
            rawMetadata &&
            typeof rawMetadata.extracted_company_name === "string" &&
            rawMetadata.extracted_company_name.length > 0;

          if (hasValidMetadata) {
            const metadata: CreatePipelineCompanyMetadata = {
              extracted_company_name: rawMetadata.extracted_company_name as string,
              extracted_domain: (rawMetadata.extracted_domain as string) || null,
              primary_contact_name: (rawMetadata.primary_contact_name as string) || "",
              primary_contact_email: (rawMetadata.primary_contact_email as string) || "",
              description_oneliner: (rawMetadata.description_oneliner as string) || "",
              notes_summary: (rawMetadata.notes_summary as string) || "",
              suggested_tags: (rawMetadata.suggested_tags as string[]) || [],
              intro_source: (rawMetadata.intro_source as string) || "Email",
            };
            setPipelineModalItem({ item: inboxItem, metadata });
          } else {
            setPipelineModalItem({
              item: inboxItem,
              metadata: {
                extracted_company_name: suggestion.company_name || inboxItem.senderName || "",
                extracted_domain: inboxItem.senderEmail?.split("@")[1] || null,
                primary_contact_name: inboxItem.senderName || "",
                primary_contact_email: inboxItem.senderEmail || "",
                description_oneliner: "",
                notes_summary: inboxItem.preview || "",
                suggested_tags: [],
                intro_source: "Email",
              },
            });
          }
          break;
        }
        case "CREATE_FOLLOW_UP_TASK": {
          setTaskPrefill({
            content: suggestion.title,
            description: inboxItem.preview || undefined,
            companyId: suggestion.company_id || inboxItem.relatedCompanyId || undefined,
            companyType: suggestion.company_type || undefined,
            companyName: suggestion.company_name || inboxItem.relatedCompanyName || undefined,
            sourceInboxItemId: inboxItem.id,
            category: "follow_up",
          });
          setIsTaskDialogOpen(true);
          break;
        }
        case "CREATE_PERSONAL_TASK": {
          setTaskPrefill({
            content: suggestion.title,
            description: inboxItem.preview || undefined,
            sourceInboxItemId: inboxItem.id,
            category: "personal",
          });
          setIsTaskDialogOpen(true);
          break;
        }
        case "CREATE_INTRO_TASK": {
          setTaskPrefill({
            content: suggestion.title,
            description: inboxItem.preview || undefined,
            companyId: suggestion.company_id || inboxItem.relatedCompanyId || undefined,
            companyType: suggestion.company_type || undefined,
            companyName: suggestion.company_name || inboxItem.relatedCompanyName || undefined,
            sourceInboxItemId: inboxItem.id,
            category: "intro",
          });
          setIsTaskDialogOpen(true);
          break;
        }
        case "SET_STATUS": {
          toast.info("Status update coming soon");
          break;
        }
        case "EXTRACT_UPDATE_HIGHLIGHTS": {
          toast.info("Highlights extraction coming soon");
          break;
        }
        default: {
          handleCreateTask(inboxItem, suggestion.title);
          break;
        }
      }
    },
    [linkCompany, handleCreateTask]
  );

  const handleCompanyLinked = useCallback(
    (companyId: string, companyName: string, companyType: "pipeline" | "portfolio", companyLogoUrl?: string | null) => {
      if (linkCompanyItem) {
        linkCompany(linkCompanyItem.id, companyId, companyName, companyType, companyLogoUrl);
        setLinkCompanyItem(null);
      }
    },
    [linkCompanyItem, linkCompany]
  );

  const handlePipelineCompanyCreated = useCallback(
    (companyId: string, companyName: string) => {
      if (pipelineModalItem) {
        linkCompany(pipelineModalItem.item.id, companyId, companyName, "pipeline");
        toast.success(`${companyName} added to pipeline and linked to email`);
      }
      setPipelineModalItem(null);
    },
    [pipelineModalItem, linkCompany]
  );

  if (typeof window === "undefined") return null;

  return (
    <>
      {createPortal(
        <AnimatePresence>
          {open && item && (
            <>
              {/* Backdrop - z-[48] so modals at z-50 render above */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[48] bg-black/20 dark:bg-black/40"
                onClick={onClose}
              />

              {/* Drawer - z-[49] so modals at z-50 render above */}
              <motion.div
                ref={containerRef}
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed inset-y-0 right-0 z-[49] flex"
                style={{ width }}
              >
                {/* Resize Handle */}
                <div
                  className={`absolute left-0 inset-y-0 w-1.5 cursor-ew-resize group z-10 ${
                    isResizing ? "bg-primary" : "hover:bg-primary/50"
                  }`}
                  onMouseDown={handleResizeStart}
                >
                  <div className="absolute inset-y-0 -left-1 -right-1" />
                  <div
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 rounded-full transition-colors ${
                      isResizing ? "bg-primary" : "bg-muted-foreground/30 group-hover:bg-primary/70"
                    }`}
                  />
                </div>

                {/* Main Content */}
                <div className="flex-1 h-full bg-background border-l border-border shadow-2xl overflow-hidden flex flex-col">
                  {/* Triage bar at top */}
                  <TriageActionsBar
                    onMarkTrusted={onMarkTrusted}
                    onSnooze={onSnooze}
                    onNoAction={onNoAction}
                    showLink={showLink}
                    onLink={onLink}
                  />

                  {/* Close button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="absolute top-12 right-4 z-20 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </Button>

                  {/* Workspace */}
                  <div className="flex-1 overflow-hidden">
                    <InboxDetailWorkspace
                      item={item}
                      onClose={onClose}
                      onCreateTask={handleCreateTask}
                      onMarkComplete={onMarkComplete}
                      onArchive={onArchive}
                      onSnooze={handleSnooze}
                      onAddNote={handleAddNote}
                      onLinkCompany={handleLinkCompany}
                      onSaveAttachments={handleSaveAttachments}
                      onApproveSuggestion={handleApproveSuggestion}
                      onSaveAttachmentToCompany={item ? (attachment) => handleSaveAttachmentToCompany(item, attachment) : undefined}
                      onUnlinkCompany={unlinkCompany}
                      hideCloseButton={true}
                    />
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Modals - rendered outside the portal so they use default z-50 (above drawer z-49) */}
      <AddTaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        onAddTask={(taskData) => createTask(taskData)}
        prefill={taskPrefill || undefined}
      />

      {linkCompanyItem && (
        <LinkCompanyModal
          open={!!linkCompanyItem}
          onOpenChange={(openState) => !openState && setLinkCompanyItem(null)}
          inboxItem={linkCompanyItem}
          onLinked={handleCompanyLinked}
        />
      )}

      {saveAttachmentsItem && (
        <SaveAttachmentsModal
          open={!!saveAttachmentsItem}
          onOpenChange={(openState) => !openState && setSaveAttachmentsItem(null)}
          inboxItemId={saveAttachmentsItem.id}
          linkedCompanyId={saveAttachmentsItem.relatedCompanyId}
          linkedCompanyName={saveAttachmentsItem.relatedCompanyName}
          linkedCompanyType={saveAttachmentsItem.relatedCompanyId ? "pipeline" : undefined}
          onLinkCompany={(companyId, companyName) => {
            linkCompany(saveAttachmentsItem.id, companyId, companyName);
          }}
        />
      )}

      {pipelineModalItem && (
        <CreatePipelineFromInboxModal
          open={!!pipelineModalItem}
          onOpenChange={(openState) => !openState && setPipelineModalItem(null)}
          inboxItem={pipelineModalItem.item}
          prefillData={pipelineModalItem.metadata}
          onCompanyCreated={handlePipelineCompanyCreated}
        />
      )}
    </>
  );
}
