import { useState } from "react";
import { Handshake, Loader2, Calendar, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { motion } from "framer-motion";
import { format, addDays, nextFriday, nextMonday, startOfTomorrow } from "date-fns";
import type { InboxItem } from "@/types/inbox";
import type { StructuredSuggestion } from "@/types/inboxSuggestions";
import type { CommitmentDraft, ConfidenceLevel } from "@/types/emailActionDrafts";
import { buildCommitmentDraftFromSuggestion, buildManualCommitmentDraft } from "@/lib/inbox/buildTaskDraft";
import { cn } from "@/lib/utils";

export interface CommitmentFormData {
  title: string;
  content: string;
  context?: string;
  dueDate?: Date | null;
  counterpartyName?: string;
  companyId?: string;
  companyName?: string;
  companyType?: "portfolio" | "pipeline";
  direction: "owed_by_me" | "owed_to_me";
  alsoCreateTask: boolean;
  sourceEmailId: string;
}

interface InlineCommitmentFormProps {
  emailItem: InboxItem;
  suggestion?: StructuredSuggestion | null;
  onConfirm: (data: CommitmentFormData) => Promise<void>;
  onCancel: () => void;
}

// Quick Date Picks Component
function QuickDatePicks({ 
  onSelect,
  selectedDate,
}: { 
  onSelect: (date: Date) => void;
  selectedDate?: Date | null;
}) {
  const quickPicks = [
    { label: "Today", date: new Date() },
    { label: "Tomorrow", date: startOfTomorrow() },
    { label: "End of week", date: nextFriday(new Date()) },
    { label: "Next Monday", date: nextMonday(new Date()) },
    { label: "In a week", date: addDays(new Date(), 7) },
  ];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1 pb-2 border-b border-border">
        {quickPicks.map((pick) => (
          <button
            key={pick.label}
            type="button"
            onClick={() => onSelect(pick.date)}
            className={cn(
              "px-2 py-0.5 text-[10px] rounded-full border transition-colors",
              selectedDate?.toDateString() === pick.date.toDateString()
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:bg-muted"
            )}
          >
            {pick.label}
          </button>
        ))}
      </div>
      <CalendarComponent
        mode="single"
        selected={selectedDate || undefined}
        onSelect={(date) => date && onSelect(date)}
        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
        className="p-0"
      />
    </div>
  );
}

export function InlineCommitmentForm({
  emailItem,
  suggestion,
  onConfirm,
  onCancel,
}: InlineCommitmentFormProps) {
  // Build draft - with or without suggestion
  const initialDraft = suggestion 
    ? buildCommitmentDraftFromSuggestion(emailItem, suggestion)
    : buildManualCommitmentDraft(emailItem);
  
  // Form state
  const [title, setTitle] = useState(initialDraft.title);
  const [counterpartyName, setCounterpartyName] = useState(initialDraft.counterpartyName || "");
  const [dueDate, setDueDate] = useState<Date | null>(initialDraft.dueDate || null);
  const [dueDateConfidence, setDueDateConfidence] = useState<ConfidenceLevel | undefined>(
    initialDraft.dueDateConfidence
  );
  const [alsoCreateTask, setAlsoCreateTask] = useState(initialDraft.alsoCreateTask ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onConfirm({
        title: title.trim(),
        content: initialDraft.content,
        context: initialDraft.context,
        dueDate,
        counterpartyName: counterpartyName.trim() || undefined,
        companyId: initialDraft.companyId,
        companyName: initialDraft.companyName,
        companyType: initialDraft.companyType,
        direction: initialDraft.direction,
        alsoCreateTask,
        sourceEmailId: emailItem.id,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
    if (e.key === "Enter" && e.metaKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2 text-xs font-medium text-destructive">
          <Handshake className="h-3.5 w-3.5" />
          Track Obligation
        </div>

        {/* Rationale from suggestion - only if present */}
        {suggestion?.rationale && (
          <div className="p-2 rounded bg-background/80 border border-border">
            <p className="text-[10px] text-muted-foreground italic">
              {suggestion.rationale}
            </p>
          </div>
        )}

        {/* Form fields */}
        <div className="space-y-3" onKeyDown={handleKeyDown}>
          {/* Title */}
          <div>
            <Label htmlFor="commitment-title" className="text-xs text-muted-foreground">
              What is owed?
            </Label>
            <Input
              id="commitment-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Send deck by Friday"
              className="h-8 text-sm mt-1"
              autoFocus
            />
          </div>

          {/* Counterparty */}
          <div>
            <Label htmlFor="commitment-from" className="text-xs text-muted-foreground">
              From whom?
            </Label>
            <div className="relative mt-1">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                id="commitment-from"
                value={counterpartyName}
                onChange={(e) => setCounterpartyName(e.target.value)}
                placeholder="Person's name"
                className="h-8 text-sm pl-8"
              />
            </div>
          </div>

          {/* Due date */}
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground w-14">Due:</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={cn(
                    "h-7 text-xs px-2",
                    dueDate && "text-foreground"
                  )}
                >
                  <Calendar className="h-3 w-3 mr-1.5" />
                  {dueDate ? format(dueDate, "MMM d, yyyy") : "Select date"}
                  {dueDate && dueDateConfidence === "suggested" && (
                    <span className="text-amber-600 dark:text-amber-500 text-[8px] ml-1">(Suggested)</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-2 bg-popover">
                <QuickDatePicks
                  selectedDate={dueDate}
                  onSelect={(date) => {
                    setDueDate(date);
                    setDueDateConfidence("explicit");
                  }}
                />
              </PopoverContent>
            </Popover>
            {dueDate && (
              <button
                type="button"
                onClick={() => {
                  setDueDate(null);
                  setDueDateConfidence(undefined);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Company context if present */}
          {initialDraft.companyName && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Related to:</span>
              <span className="font-medium text-foreground">
                {initialDraft.companyName}
              </span>
            </div>
          )}

          {/* Also create task checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="also-create-task"
              checked={alsoCreateTask}
              onCheckedChange={(checked) => setAlsoCreateTask(checked === true)}
            />
            <Label 
              htmlFor="also-create-task" 
              className="text-xs text-muted-foreground cursor-pointer"
            >
              Also create a task to track this
            </Label>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
              className="h-7 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!title.trim() || isSubmitting}
              className="h-7 text-xs flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Creating...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground">
          Press Cmd+Enter to confirm, Esc to cancel
        </p>
      </div>
    </motion.div>
  );
}
