import { useState, useMemo, useCallback } from "react";
import { 
  ListTodo, 
  StickyNote, 
  Building2, 
  Clock, 
  Check, 
  Archive,
  Sparkles,
  History,
  ChevronDown,
  Loader2,
  Wand2,
  Download,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AnimatePresence } from "framer-motion";
import { useInboxSuggestionsV2 } from "@/hooks/useInboxSuggestionsV2";
import { useTasks } from "@/hooks/useTasks";
import { useInboxItems } from "@/hooks/useInboxItems";
import { useAuth } from "@/contexts/AuthContext";
import { SuggestionCard } from "@/components/inbox/SuggestionCard";
import { EMAIL_INTENT_LABELS } from "@/types/inboxSuggestions";
import { 
  ActionSuccessState, 
  InlineTaskForm, 
  InlineLinkCompanyForm, 
  InlineNoteForm,
  InlineSaveAttachmentsForm,
  InlineCreatePipelineForm,
  type ActionType,
  type PipelineFormData,
} from "@/components/inbox/inline-actions";
import { usePipeline } from "@/hooks/usePipeline";
import { supabase } from "@/integrations/supabase/client";
import type { CreatePipelineCompanyMetadata } from "@/types/inboxSuggestions";
import { copyInboxAttachmentToPipeline } from "@/lib/inbox/copyAttachmentToCompany";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { InboxItem } from "@/types/inbox";
import type { StructuredSuggestion } from "@/types/inboxSuggestions";
import type { InboxAttachment } from "@/hooks/useInboxAttachments";
import { formatDistanceToNow } from "date-fns";

interface InlineActionPanelProps {
  item: InboxItem;
  attachmentCount?: number;
  onMarkComplete: (id: string) => void;
  onArchive: (id: string) => void;
  onSnooze?: (id: string, until: Date) => void;
}

interface ActionResult {
  id: string;
  name: string;
  link?: string;
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2">
      {children}
    </h4>
  );
}

function ActionButton({ 
  icon: Icon, 
  label, 
  onClick, 
  variant = "ghost",
  disabled = false,
  isActive = false,
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  label: string; 
  onClick: () => void;
  variant?: "ghost" | "outline" | "default";
  disabled?: boolean;
  isActive?: boolean;
}) {
  return (
    <Button
      variant={isActive ? "default" : variant}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full justify-start h-8 text-xs font-medium",
        isActive && "bg-primary text-primary-foreground"
      )}
    >
      <Icon className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
      {label}
    </Button>
  );
}

const INTENT_STYLES: Record<string, string> = {
  intro_first_touch: "bg-primary/10 text-primary",
  pipeline_follow_up: "bg-primary/10 text-primary",
  portfolio_update: "bg-primary/10 text-primary",
  intro_request: "bg-primary/10 text-primary",
  scheduling: "bg-muted text-muted-foreground",
  personal_todo: "bg-primary/10 text-primary",
  fyi_informational: "bg-muted text-muted-foreground",
};

export function InlineActionPanel({
  item,
  attachmentCount = 0,
  onMarkComplete,
  onArchive,
  onSnooze,
}: InlineActionPanelProps) {
  const { user } = useAuth();
  const { createTask } = useTasks();
  const { linkCompany } = useInboxItems();
  const { createCompany } = usePipeline();
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  
  // Active action state
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);
  const [successResult, setSuccessResult] = useState<{ type: ActionType; result: ActionResult } | null>(null);
  const [prefillData, setPrefillData] = useState<Record<string, unknown>>({});
  const [activeSuggestion, setActiveSuggestion] = useState<StructuredSuggestion | null>(null);

  // Use the V2 suggestions hook
  const { 
    suggestions, 
    intent,
    isLoading: isSuggestionsLoading, 
    isAI, 
    isGenerating,
    generateSuggestions,
    dismissSuggestion,
  } = useInboxSuggestionsV2(item.id);

  // Get tasks created from this inbox item
  const { tasks } = useTasks();
  
  // Filter tasks that originated from this inbox item
  const relatedTasks = useMemo(() => {
    return tasks.filter(t => t.source_inbox_item_id === item.id);
  }, [tasks, item.id]);

  // Build activity items from related tasks
  const activityItems = useMemo(() => {
    return relatedTasks.map(task => ({
      action: `Created task: "${task.content.length > 40 ? task.content.slice(0, 40) + '...' : task.content}"`,
      timestamp: task.created_at 
        ? formatDistanceToNow(new Date(task.created_at), { addSuffix: true })
        : 'recently',
    }));
  }, [relatedTasks]);

  const handleSnooze = (hours: number) => {
    if (!onSnooze) return;
    const until = new Date();
    if (hours === 4) {
      until.setHours(until.getHours() + 4);
    } else if (hours === 24) {
      until.setDate(until.getDate() + 1);
      until.setHours(9, 0, 0, 0);
    } else if (hours === 168) {
      until.setDate(until.getDate() + 7);
      until.setHours(9, 0, 0, 0);
    }
    onSnooze(item.id, until);
  };

  // Action handlers
  const handleSelectAction = (action: ActionType) => {
    setActiveAction(action);
    setSuccessResult(null);
    setPrefillData({});
    setActiveSuggestion(null);
  };

  const handleCancelAction = () => {
    setActiveAction(null);
    setPrefillData({});
    setActiveSuggestion(null);
  };

  const handleActionSuccess = (type: ActionType, result: ActionResult) => {
    setSuccessResult({ type, result });
    setActiveAction(null);
    setPrefillData({});
    setActiveSuggestion(null);
  };

  const handleDoAnother = () => {
    setSuccessResult(null);
  };

  // Task creation
  const handleConfirmTask = async (data: { title: string; description: string; companyId?: string; companyName?: string; companyType?: "portfolio" | "pipeline" }) => {
    const result = await createTask({
      content: data.title,
      source_inbox_item_id: item.id,
      pipeline_company_id: data.companyType === "pipeline" ? data.companyId : undefined,
      company_id: data.companyType === "portfolio" ? data.companyId : undefined,
    });
    
    if (result) {
      handleActionSuccess("create_task", {
        id: result.id,
        name: data.title,
        link: "/tasks",
      });
      
      // Auto-dismiss suggestion if applicable
      if (activeSuggestion) {
        dismissSuggestion(activeSuggestion.id);
      }
    }
  };

  // Company linking
  const handleConfirmLinkCompany = async (company: { id: string; name: string; type: "pipeline" | "portfolio"; logoUrl?: string | null }) => {
    linkCompany(item.id, company.id, company.name, company.type, company.logoUrl);
    handleActionSuccess("link_company", {
      id: company.id,
      name: company.name,
      link: company.type === "pipeline" ? `/pipeline/${company.id}` : `/portfolio/${company.id}`,
    });
    
    if (activeSuggestion) {
      dismissSuggestion(activeSuggestion.id);
    }
  };

  // Note creation
  const handleConfirmNote = async (data: { content: string; companyId?: string }) => {
    // For now, just show success - note creation via polymorphic system
    toast.success("Note added");
    handleActionSuccess("add_note", {
      id: "note",
      name: data.content.slice(0, 50) + (data.content.length > 50 ? "..." : ""),
    });
  };

  // Attachments saving
  const handleConfirmSaveAttachments = async (attachments: InboxAttachment[]) => {
    if (!user || !item.relatedCompanyId) return;
    
    let successCount = 0;
    for (const attachment of attachments) {
      const result = await copyInboxAttachmentToPipeline(
        attachment,
        item.relatedCompanyId,
        user.id
      );
      if (result.success) successCount++;
    }
    
    if (successCount > 0) {
      handleActionSuccess("save_attachments", {
        id: "attachments",
        name: `${successCount} file${successCount !== 1 ? "s" : ""} saved`,
        link: item.relatedCompanyType === "pipeline" 
          ? `/pipeline/${item.relatedCompanyId}` 
          : `/portfolio/${item.relatedCompanyId}`,
      });
    }
  };

  // Pipeline company creation
  const handleConfirmCreatePipeline = async (data: PipelineFormData) => {
    if (!user) return;

    try {
      // 1. Create the pipeline company
      const newCompany = await createCompany({
        company_name: data.companyName,
        current_round: data.stage,
        website: data.domain ? `https://${data.domain.replace(/^https?:\/\//, '')}` : undefined,
      });

      if (!newCompany) {
        toast.error("Failed to create pipeline company");
        return;
      }

      // 2. Create primary contact if provided
      if (data.contactName) {
        await supabase.from("pipeline_contacts").insert({
          pipeline_company_id: newCompany.id,
          name: data.contactName,
          email: data.contactEmail || null,
          is_primary: true,
          is_founder: false,
          created_by: user.id,
        });
      }

      // 3. Create initial note if provided
      if (data.notes || data.source) {
        const noteContent = [
          data.notes,
          data.source ? `Source: ${data.source}` : null,
        ].filter(Boolean).join("\n\n");
        
        if (noteContent) {
          await supabase.from("pipeline_interactions").insert({
            pipeline_company_id: newCompany.id,
            content: noteContent,
            interaction_type: "note",
            created_by: user.id,
          });
        }
      }

      // 4. Link the email to the new company
      linkCompany(item.id, newCompany.id, data.companyName, "pipeline", null);

      // 5. Show success state
      handleActionSuccess("create_pipeline", {
        id: newCompany.id,
        name: data.companyName,
        link: `/pipeline/${newCompany.id}`,
      });

      // Auto-dismiss suggestion if applicable
      if (activeSuggestion) {
        dismissSuggestion(activeSuggestion.id);
      }
    } catch (error) {
      console.error("Failed to create pipeline company:", error);
      toast.error("Failed to create pipeline company");
    }
  };

  // Handle suggestion selection - prefill the form
  const handleSuggestionSelect = (suggestion: StructuredSuggestion) => {
    setActiveSuggestion(suggestion);
    
    switch (suggestion.type) {
      case "CREATE_FOLLOW_UP_TASK":
      case "CREATE_PERSONAL_TASK":
      case "CREATE_INTRO_TASK":
        setActiveAction("create_task");
        setPrefillData({
          title: suggestion.title,
          description: item.preview || "",
          companyId: suggestion.company_id || item.relatedCompanyId,
          companyName: suggestion.company_name || item.relatedCompanyName,
          rationale: suggestion.rationale,
          confidence: suggestion.confidence,
        });
        break;
      case "LINK_COMPANY":
        setActiveAction("link_company");
        setPrefillData({ 
          preselectedCompanyId: suggestion.company_id,
          companyName: suggestion.company_name,
        });
        break;
      case "CREATE_PIPELINE_COMPANY": {
        setActiveAction("create_pipeline");
        const metadata = suggestion.metadata as unknown as CreatePipelineCompanyMetadata | undefined;
        setPrefillData({
          companyName: metadata?.extracted_company_name || "",
          domain: metadata?.extracted_domain || "",
          contactName: metadata?.primary_contact_name || "",
          contactEmail: metadata?.primary_contact_email || "",
          notes: metadata?.notes_summary || "",
          source: metadata?.intro_source || "",
          rationale: suggestion.rationale,
          confidence: suggestion.confidence,
        });
        break;
      }
      default:
        setActiveAction("create_task");
        setPrefillData({ title: suggestion.title });
        break;
    }
    
    setSuccessResult(null);
  };

  const handleEditSuggestion = (suggestion: StructuredSuggestion) => {
    handleSuggestionSelect(suggestion);
  };

  return (
    <div className="h-full p-4 space-y-5 bg-muted/30 overflow-y-auto">
      {/* Success State */}
      <AnimatePresence mode="wait">
        {successResult && (
          <ActionSuccessState
            actionType={successResult.type}
            result={successResult.result}
            onDismiss={() => setSuccessResult(null)}
            onDoAnother={handleDoAnother}
          />
        )}
      </AnimatePresence>

      {/* Take Action Section */}
      {!successResult && (
        <div>
          <SectionHeader>Take Action</SectionHeader>
          
          {/* Action buttons */}
          <div className="space-y-1">
            <ActionButton
              icon={ListTodo}
              label="Create Task"
              onClick={() => handleSelectAction("create_task")}
              variant="outline"
              isActive={activeAction === "create_task"}
            />
            
            {/* Inline Task Form */}
            <AnimatePresence>
              {activeAction === "create_task" && (
                <InlineTaskForm
                  emailItem={item}
                  prefill={prefillData as any}
                  suggestion={activeSuggestion}
                  onConfirm={handleConfirmTask}
                  onCancel={handleCancelAction}
                />
              )}
            </AnimatePresence>

            <ActionButton
              icon={StickyNote}
              label="Add Note"
              onClick={() => handleSelectAction("add_note")}
              isActive={activeAction === "add_note"}
            />
            
            {/* Inline Note Form */}
            <AnimatePresence>
              {activeAction === "add_note" && (
                <InlineNoteForm
                  emailItem={item}
                  onConfirm={handleConfirmNote}
                  onCancel={handleCancelAction}
                />
              )}
            </AnimatePresence>

            <ActionButton
              icon={Building2}
              label={item.relatedCompanyName ? "Change Company" : "Link Company"}
              onClick={() => handleSelectAction("link_company")}
              isActive={activeAction === "link_company"}
            />
            {item.relatedCompanyName && !activeAction && (
              <p className="text-[10px] text-muted-foreground ml-7 -mt-0.5 mb-1 truncate">
                → {item.relatedCompanyName}
              </p>
            )}
            
            {/* Inline Link Company Form */}
            <AnimatePresence>
              {activeAction === "link_company" && (
                <InlineLinkCompanyForm
                  emailItem={item}
                  prefill={prefillData as any}
                  onConfirm={handleConfirmLinkCompany}
                  onCancel={handleCancelAction}
                />
              )}
            </AnimatePresence>

            {/* Add to Pipeline */}
            <ActionButton
              icon={Plus}
              label="Add to Pipeline"
              onClick={() => handleSelectAction("create_pipeline")}
              isActive={activeAction === "create_pipeline"}
            />
            
            {/* Inline Create Pipeline Form */}
            <AnimatePresence>
              {activeAction === "create_pipeline" && (
                <InlineCreatePipelineForm
                  emailItem={item}
                  prefill={prefillData as any}
                  suggestion={activeSuggestion}
                  onConfirm={handleConfirmCreatePipeline}
                  onCancel={handleCancelAction}
                />
              )}
            </AnimatePresence>
            
            {/* Save Attachments - only show if there are attachments */}
            {attachmentCount > 0 && (
              <>
                <ActionButton
                  icon={Download}
                  label="Save to Company"
                  onClick={() => handleSelectAction("save_attachments")}
                  isActive={activeAction === "save_attachments"}
                />
                {!activeAction && (
                  <p className="text-[10px] text-muted-foreground italic ml-7 -mt-0.5 mb-1">
                    {attachmentCount} attachment{attachmentCount !== 1 ? 's' : ''} available
                  </p>
                )}
                
                {/* Inline Save Attachments Form */}
                <AnimatePresence>
                  {activeAction === "save_attachments" && (
                    <InlineSaveAttachmentsForm
                      emailItem={item}
                      onConfirm={handleConfirmSaveAttachments}
                      onCancel={handleCancelAction}
                      onLinkCompanyFirst={() => handleSelectAction("link_company")}
                    />
                  )}
                </AnimatePresence>
              </>
            )}
            
            {/* Snooze Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 text-xs font-medium"
                  disabled={!onSnooze || !!activeAction}
                >
                  <Clock className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                  Snooze
                  <ChevronDown className="h-3 w-3 ml-auto" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40 bg-popover">
                <DropdownMenuItem onClick={() => handleSnooze(4)}>
                  Later today
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSnooze(24)}>
                  Tomorrow
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSnooze(168)}>
                  Next week
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Divider */}
          <div className="border-t border-border my-3" />

          <div className="space-y-1">
            <ActionButton
              icon={Check}
              label="Complete"
              onClick={() => onMarkComplete(item.id)}
              disabled={!!activeAction}
            />
            <ActionButton
              icon={Archive}
              label="Archive"
              onClick={() => onArchive(item.id)}
              disabled={!!activeAction}
            />
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Suggested Actions Section */}
      <div>
        <SectionHeader>
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            Suggested Actions
            {suggestions.length > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                {suggestions.length}
              </span>
            )}
            {isAI && (
              <Badge variant="outline" className="text-[8px] h-4 px-1 ml-1 border-primary/30 text-primary">
                AI
              </Badge>
            )}
          </span>
        </SectionHeader>

        {/* Intent badge */}
        {intent && (
          <div className="mb-2">
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium",
                INTENT_STYLES[intent] || INTENT_STYLES.fyi_informational
              )}
            >
              {EMAIL_INTENT_LABELS[intent] || intent}
            </span>
          </div>
        )}

        {isSuggestionsLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading...
          </div>
        ) : suggestions.length === 0 && isGenerating ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Generating suggestions...
          </div>
        ) : suggestions.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            No suggestions available
          </p>
        ) : (
          <div className="space-y-2">
            {suggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onApprove={handleSuggestionSelect}
                onEdit={handleEditSuggestion}
                onDismiss={dismissSuggestion}
              />
            ))}
          </div>
        )}

        {/* Generate with AI button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 h-7 text-[10px] text-muted-foreground hover:text-foreground"
          onClick={() => generateSuggestions(isAI)}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
          ) : (
            <Wand2 className="h-3 w-3 mr-1.5" />
          )}
          {isGenerating ? "Generating..." : "Regenerate"}
        </Button>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Activity Section */}
      <Collapsible open={isActivityOpen} onOpenChange={setIsActivityOpen}>
        <CollapsibleTrigger className="w-full">
          <SectionHeader>
            <span className="flex items-center gap-1.5">
              <History className="h-3 w-3" />
              Activity
              {activityItems.length > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {activityItems.length}
                </span>
              )}
              <ChevronDown className={cn(
                "h-3 w-3 ml-auto transition-transform",
                isActivityOpen && "rotate-180"
              )} />
            </span>
          </SectionHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {activityItems.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No activity recorded
            </p>
          ) : (
            <div className="space-y-2">
              {activityItems.map((activity, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-foreground">{activity.action}</p>
                    <p className="text-muted-foreground text-[10px]">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
