import { useState, useEffect } from "react";
import { ListTodo, Loader2, X, ChevronDown, Plus, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { motion } from "framer-motion";
import { format, addDays, nextFriday, nextMonday, startOfTomorrow } from "date-fns";
import type { InboxItem } from "@/types/inbox";
import type { StructuredSuggestion } from "@/types/inboxSuggestions";
import type { TaskDraft, ConfidenceLevel } from "@/types/emailActionDrafts";
import { buildTaskDraftFromEmail } from "@/lib/inbox/buildTaskDraft";
import { cn } from "@/lib/utils";

interface TaskFormData {
  title: string;
  description: string;
  companyId?: string;
  companyName?: string;
  companyType?: "portfolio" | "pipeline";
  priority?: "low" | "medium" | "high";
  dueDate?: Date | null;
  category?: string;
}

interface InlineTaskFormProps {
  emailItem: InboxItem;
  prefill?: {
    title?: string;
    description?: string;
    companyId?: string;
    companyName?: string;
    rationale?: string;
    confidence?: string;
  };
  suggestion?: StructuredSuggestion | null;
  onConfirm: (data: TaskFormData) => Promise<void>;
  onCancel: () => void;
}

// Suggestion Chip Component
interface SuggestionChipProps {
  label: string;
  value: string;
  confidence?: ConfidenceLevel;
  icon?: React.ReactNode;
  onClear?: () => void;
  children?: React.ReactNode;
}

function SuggestionChip({ 
  label, 
  value, 
  confidence, 
  icon,
  onClear,
  children 
}: SuggestionChipProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          type="button"
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]",
            "bg-muted hover:bg-muted/80 border border-border/50",
            "transition-colors cursor-pointer"
          )}
        >
          {icon}
          <span className="font-medium">{label}:</span>
          <span className="text-foreground">{value}</span>
          {confidence === "suggested" && (
            <span className="text-amber-600 dark:text-amber-500 text-[8px] ml-0.5">(Suggested)</span>
          )}
          {onClear && (
            <X 
              className="h-2.5 w-2.5 ml-0.5 opacity-60 hover:opacity-100" 
              onClick={(e) => { 
                e.stopPropagation(); 
                onClear(); 
              }} 
            />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent 
        align="start" 
        className="w-auto p-2 bg-popover"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}

// Priority Options Component
function PriorityOptions({ 
  value, 
  onChange 
}: { 
  value?: string; 
  onChange: (val: "low" | "medium" | "high") => void 
}) {
  const options: { value: "low" | "medium" | "high"; label: string; color: string }[] = [
    { value: "low", label: "Low", color: "text-muted-foreground" },
    { value: "medium", label: "Medium", color: "text-amber-600 dark:text-amber-500" },
    { value: "high", label: "High", color: "text-destructive" },
  ];

  return (
    <div className="flex flex-col gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "text-left px-2 py-1 text-xs rounded hover:bg-muted transition-colors",
            value === opt.value && "bg-muted font-medium"
          )}
        >
          <span className={opt.color}>{opt.label}</span>
          {value === opt.value && <span className="ml-1 text-muted-foreground">*</span>}
        </button>
      ))}
    </div>
  );
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

// Category Options Component
function CategoryOptions({ 
  value, 
  onChange 
}: { 
  value?: string; 
  onChange: (val: string) => void 
}) {
  const categories = ["Personal", "Admin", "Investing", "Travel", "Work"];

  return (
    <div className="flex flex-col gap-1">
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onChange(cat)}
          className={cn(
            "text-left px-2 py-1 text-xs rounded hover:bg-muted transition-colors",
            value === cat && "bg-muted font-medium"
          )}
        >
          {cat}
          {value === cat && <span className="ml-1 text-muted-foreground">*</span>}
        </button>
      ))}
    </div>
  );
}

export function InlineTaskForm({
  emailItem,
  prefill,
  suggestion,
  onConfirm,
  onCancel,
}: InlineTaskFormProps) {
  // Build draft from email and suggestion
  const initialDraft = buildTaskDraftFromEmail(emailItem, suggestion);
  
  // Form state
  const [title, setTitle] = useState(prefill?.title || initialDraft.title || "");
  const [description, setDescription] = useState(initialDraft.initialNote || "");
  const [isNoteExpanded, setIsNoteExpanded] = useState(!!initialDraft.initialNote);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  
  // Metadata state
  const [dueDate, setDueDate] = useState<Date | null>(initialDraft.dueDate || null);
  const [dueDateConfidence, setDueDateConfidence] = useState<ConfidenceLevel | undefined>(
    initialDraft.dueDateConfidence
  );
  const [priority, setPriority] = useState<"low" | "medium" | "high" | undefined>(
    initialDraft.priority
  );
  const [priorityConfidence, setPriorityConfidence] = useState<ConfidenceLevel | undefined>(
    initialDraft.priorityConfidence
  );
  const [category, setCategory] = useState<string | undefined>(initialDraft.category);
  const [categoryConfidence, setCategoryConfidence] = useState<ConfidenceLevel | undefined>(
    initialDraft.categoryConfidence
  );
  const [companyId, setCompanyId] = useState<string | undefined>(
    prefill?.companyId || initialDraft.companyId
  );
  const [companyName, setCompanyName] = useState<string | undefined>(
    prefill?.companyName || initialDraft.companyName
  );
  const [companyType, setCompanyType] = useState<"portfolio" | "pipeline" | undefined>(
    initialDraft.companyType
  );
  const [companyConfidence, setCompanyConfidence] = useState<ConfidenceLevel | undefined>(
    initialDraft.companyConfidence
  );
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when prefill changes
  useEffect(() => {
    if (prefill?.title) {
      setTitle(prefill.title);
    }
    if (prefill?.description) {
      setDescription(prefill.description);
      setIsNoteExpanded(true);
    }
  }, [prefill?.title, prefill?.description]);

  const handleSubmit = async () => {
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onConfirm({
        title: title.trim(),
        description: description.trim(),
        companyId,
        companyName,
        companyType,
        priority,
        dueDate,
        category,
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

  // Check if we have any suggested chips to show
  const hasSuggestedChips = dueDate || priority || category || companyName;
  const hasHiddenDetails = !dueDate || !priority || !category;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="p-3 rounded-lg border border-border bg-background space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2 text-xs font-medium text-foreground">
          <ListTodo className="h-3.5 w-3.5" />
          Create Task
        </div>

        {/* Suggestion rationale */}
        {suggestion && (
          <div className="p-2 rounded bg-muted/50 border border-muted">
            <p className="text-[10px] text-muted-foreground italic">
              {suggestion.rationale}
            </p>
          </div>
        )}

        {/* Form fields */}
        <div className="space-y-3" onKeyDown={handleKeyDown}>
          {/* Title input - always visible */}
          <div>
            <Label htmlFor="task-title" className="text-xs text-muted-foreground">
              Task
            </Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="h-8 text-sm mt-1"
              autoFocus
            />
          </div>

          {/* Note section - collapsible */}
          <Collapsible open={isNoteExpanded} onOpenChange={setIsNoteExpanded}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors",
                  isNoteExpanded && "mb-1"
                )}
              >
                <Plus className={cn("h-3 w-3 transition-transform", isNoteExpanded && "rotate-45")} />
                {isNoteExpanded ? "Hide note" : "Add note"}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Textarea
                id="task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add context or details..."
                className="min-h-[60px] text-sm resize-none"
                rows={2}
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Suggested chips - only show populated ones */}
          {hasSuggestedChips && (
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground font-medium">Suggested:</p>
              <div className="flex flex-wrap gap-1.5">
                {/* Due Date Chip */}
                {dueDate && (
                  <SuggestionChip
                    label="Due"
                    value={format(dueDate, "MMM d")}
                    confidence={dueDateConfidence}
                    icon={<Calendar className="h-2.5 w-2.5" />}
                    onClear={() => {
                      setDueDate(null);
                      setDueDateConfidence(undefined);
                    }}
                  >
                    <QuickDatePicks
                      selectedDate={dueDate}
                      onSelect={(date) => {
                        setDueDate(date);
                        setDueDateConfidence("explicit");
                      }}
                    />
                  </SuggestionChip>
                )}

                {/* Priority Chip */}
                {priority && (
                  <SuggestionChip
                    label="Priority"
                    value={priority.charAt(0).toUpperCase() + priority.slice(1)}
                    confidence={priorityConfidence}
                    icon={<AlertCircle className="h-2.5 w-2.5" />}
                    onClear={() => {
                      setPriority(undefined);
                      setPriorityConfidence(undefined);
                    }}
                  >
                    <PriorityOptions
                      value={priority}
                      onChange={(val) => {
                        setPriority(val);
                        setPriorityConfidence("explicit");
                      }}
                    />
                  </SuggestionChip>
                )}

                {/* Category Chip */}
                {category && (
                  <SuggestionChip
                    label="Category"
                    value={category}
                    confidence={categoryConfidence}
                    onClear={() => {
                      setCategory(undefined);
                      setCategoryConfidence(undefined);
                    }}
                  >
                    <CategoryOptions
                      value={category}
                      onChange={(val) => {
                        setCategory(val);
                        setCategoryConfidence("explicit");
                      }}
                    />
                  </SuggestionChip>
                )}

                {/* Company Chip - read only */}
                {companyName && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-muted border border-border/50">
                    <span className="font-medium">Company:</span>
                    <span className="text-foreground">{companyName}</span>
                    {companyConfidence === "linked" && (
                      <span className="text-primary text-[8px] ml-0.5">(Linked)</span>
                    )}
                    {companyConfidence === "suggested" && (
                      <span className="text-amber-600 dark:text-amber-500 text-[8px] ml-0.5">(Suggested)</span>
                    )}
                    <X 
                      className="h-2.5 w-2.5 ml-0.5 opacity-60 hover:opacity-100 cursor-pointer" 
                      onClick={() => {
                        setCompanyId(undefined);
                        setCompanyName(undefined);
                        setCompanyType(undefined);
                        setCompanyConfidence(undefined);
                      }} 
                    />
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Add details section - for fields not already shown */}
          {hasHiddenDetails && (
            <Collapsible open={isDetailsExpanded} onOpenChange={setIsDetailsExpanded}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronDown className={cn(
                    "h-3 w-3 transition-transform",
                    isDetailsExpanded && "rotate-180"
                  )} />
                  Add details...
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2 space-y-2">
                {/* Due date picker */}
                {!dueDate && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-14">Due:</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-6 text-[10px] px-2">
                          <Calendar className="h-3 w-3 mr-1" />
                          Select date
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
                  </div>
                )}

                {/* Priority selector */}
                {!priority && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-14">Priority:</span>
                    <div className="flex gap-1">
                      {(["low", "medium", "high"] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            setPriority(p);
                            setPriorityConfidence("explicit");
                          }}
                          className={cn(
                            "px-2 py-0.5 text-[10px] rounded border transition-colors",
                            priority === p
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border hover:bg-muted"
                          )}
                        >
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category selector */}
                {!category && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-14">Category:</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-6 text-[10px] px-2">
                          Select category
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-auto p-2 bg-popover">
                        <CategoryOptions
                          value={category}
                          onChange={(val) => {
                            setCategory(val);
                            setCategoryConfidence("explicit");
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}

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
              className="h-7 text-xs flex-1"
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
