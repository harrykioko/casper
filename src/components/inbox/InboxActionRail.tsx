import { useState } from "react";
import { 
  ListTodo, 
  StickyNote, 
  Building2, 
  Tag, 
  Clock, 
  Check, 
  Archive,
  Sparkles,
  History,
  ChevronDown,
  Loader2,
  Wand2,
  Download,
  Paperclip,
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
import { useInboxSuggestionsV2 } from "@/hooks/useInboxSuggestionsV2";
import { SuggestionCard } from "@/components/inbox/SuggestionCard";
import { EMAIL_INTENT_LABELS } from "@/types/inboxSuggestions";
import type { StructuredSuggestion } from "@/types/inboxSuggestions";
import { cn } from "@/lib/utils";
import type { InboxItem } from "@/types/inbox";

interface InboxActionRailProps {
  item: InboxItem;
  onCreateTask: (item: InboxItem, suggestionTitle?: string) => void;
  onMarkComplete: (id: string) => void;
  onArchive: (id: string) => void;
  onSnooze?: (id: string, until: Date) => void;
  onAddNote?: (item: InboxItem) => void;
  onLinkCompany?: (item: InboxItem) => void;
  onSaveAttachments?: (item: InboxItem) => void;
  onApproveSuggestion?: (item: InboxItem, suggestion: StructuredSuggestion) => void;
  attachmentCount?: number;
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
  disabled = false 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  label: string; 
  onClick: () => void;
  variant?: "ghost" | "outline" | "default";
  disabled?: boolean;
}) {
  return (
    <Button
      variant={variant}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="w-full justify-start h-8 text-xs font-medium"
    >
      <Icon className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
      {label}
    </Button>
  );
}

const INTENT_STYLES: Record<string, string> = {
  intro_first_touch: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  pipeline_follow_up: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  portfolio_update: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  intro_request: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  scheduling: "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-400",
  personal_todo: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  fyi_informational: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400",
};

export function InboxActionRail({
  item,
  onCreateTask,
  onMarkComplete,
  onArchive,
  onSnooze,
  onAddNote,
  onLinkCompany,
  onApproveSuggestion,
  onSaveAttachments,
  attachmentCount = 0,
}: InboxActionRailProps) {
  const [isActivityOpen, setIsActivityOpen] = useState(false);

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

  const handleApproveSuggestion = (suggestion: StructuredSuggestion) => {
    if (onApproveSuggestion) {
      onApproveSuggestion(item, suggestion);
    } else {
      // Fallback: create a task with the suggestion title
      onCreateTask(item, suggestion.title);
    }
    // Auto-dismiss the suggestion after acting on it
    dismissSuggestion(suggestion.id);
  };

  const handleEditSuggestion = (suggestion: StructuredSuggestion) => {
    // Open task dialog with prefilled title for editing
    onCreateTask(item, suggestion.title);
  };

  // Placeholder activity - will be replaced with actual activity log from tasks
  const activityItems: { action: string; timestamp: string }[] = [];

  return (
    <div className="h-full p-4 space-y-5 bg-muted/30">
      {/* Take Action Section */}
      <div>
        <SectionHeader>Take Action</SectionHeader>
        <div className="space-y-1">
          <ActionButton
            icon={ListTodo}
            label="Create Task"
            onClick={() => onCreateTask(item)}
            variant="outline"
          />
          <p className="text-[10px] text-muted-foreground italic ml-7 -mt-0.5 mb-1">
            Will include email attachments
          </p>
          <ActionButton
            icon={StickyNote}
            label="Add Note"
            onClick={() => onAddNote?.(item)}
            disabled={!onAddNote}
          />
          <ActionButton
            icon={Building2}
            label={item.relatedCompanyName ? "Change Company" : "Link Company"}
            onClick={() => onLinkCompany?.(item)}
            disabled={!onLinkCompany}
          />
          {item.relatedCompanyName && (
            <p className="text-[10px] text-muted-foreground ml-7 -mt-0.5 mb-1 truncate">
              → {item.relatedCompanyName}
            </p>
          )}
          
          {/* Save Attachments - only show if there are attachments */}
          {attachmentCount > 0 && (
            <>
              <ActionButton
                icon={Download}
                label="Save to Company"
                onClick={() => onSaveAttachments?.(item)}
                disabled={!onSaveAttachments}
              />
              <p className="text-[10px] text-muted-foreground italic ml-7 -mt-0.5 mb-1">
                {attachmentCount} attachment{attachmentCount !== 1 ? 's' : ''} available
              </p>
            </>
          )}
          
          <ActionButton
            icon={Tag}
            label="Set Category"
            onClick={() => {}}
            disabled
          />
          
          {/* Snooze Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-8 text-xs font-medium"
                disabled={!onSnooze}
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
          />
          <ActionButton
            icon={Archive}
            label="Archive"
            onClick={() => onArchive(item.id)}
          />
        </div>
      </div>

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
        ) : suggestions.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            No suggestions yet
          </p>
        ) : (
          <div className="space-y-2">
            {suggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onApprove={handleApproveSuggestion}
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
          {isGenerating ? "Generating..." : isAI ? "Regenerate" : "Generate with AI"}
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
