// SuggestionCard - Renders a single structured suggestion

import { 
  Building2, 
  PlusCircle, 
  ArrowRight, 
  ListTodo, 
  Users, 
  Flag, 
  Sparkles,
  X,
  Pencil,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StructuredSuggestion, SuggestionType } from "@/types/inboxSuggestions";
import { EFFORT_LABELS } from "@/types/inboxSuggestions";

interface SuggestionCardProps {
  suggestion: StructuredSuggestion;
  onApprove: (suggestion: StructuredSuggestion) => void;
  onEdit: (suggestion: StructuredSuggestion) => void;
  onDismiss: (suggestionId: string) => void;
}

const TYPE_CONFIG: Record<
  SuggestionType,
  { icon: typeof Building2; label: string; accent: string }
> = {
  LINK_COMPANY: {
    icon: Building2,
    label: "Link",
    accent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  CREATE_PIPELINE_COMPANY: {
    icon: PlusCircle,
    label: "Pipeline",
    accent: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  },
  CREATE_FOLLOW_UP_TASK: {
    icon: ArrowRight,
    label: "Follow-up",
    accent: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  CREATE_PERSONAL_TASK: {
    icon: ListTodo,
    label: "Task",
    accent: "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-400",
  },
  CREATE_INTRO_TASK: {
    icon: Users,
    label: "Intro",
    accent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  SET_STATUS: {
    icon: Flag,
    label: "Status",
    accent: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  EXTRACT_UPDATE_HIGHLIGHTS: {
    icon: Sparkles,
    label: "Highlights",
    accent: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  },
};

const CONFIDENCE_STYLES: Record<string, string> = {
  high: "text-emerald-600 dark:text-emerald-400",
  medium: "text-amber-600 dark:text-amber-400",
  low: "text-slate-500 dark:text-slate-400",
};

export function SuggestionCard({
  suggestion,
  onApprove,
  onEdit,
  onDismiss,
}: SuggestionCardProps) {
  const config = TYPE_CONFIG[suggestion.type] || TYPE_CONFIG.CREATE_PERSONAL_TASK;
  const Icon = config.icon;

  return (
    <div className="p-2.5 rounded-lg border border-border bg-background/50 space-y-2">
      {/* Header: Type badge + Confidence */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
              config.accent
            )}
          >
            <Icon className="h-3 w-3" />
            {config.label}
          </span>
          {suggestion.company_name && (
            <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
              {suggestion.company_name}
            </span>
          )}
        </div>
        <span
          className={cn(
            "text-[10px] font-medium capitalize",
            CONFIDENCE_STYLES[suggestion.confidence]
          )}
        >
          {suggestion.confidence}
        </span>
      </div>

      {/* Title */}
      <p className="text-xs font-medium leading-snug">{suggestion.title}</p>

      {/* Meta: Effort + Due hint */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {EFFORT_LABELS[suggestion.effort_bucket] || `~${suggestion.effort_minutes} min`}
        </span>
        {suggestion.due_hint && (
          <span className="text-amber-600 dark:text-amber-400">
            Due: {suggestion.due_hint}
          </span>
        )}
      </div>

      {/* Rationale */}
      <p className="text-[10px] text-muted-foreground italic leading-relaxed">
        {suggestion.rationale}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-1 pt-1">
        <Button
          size="sm"
          variant="outline"
          className="h-6 text-[10px] flex-1"
          onClick={() => onApprove(suggestion)}
        >
          {suggestion.type === "LINK_COMPANY" ? "Link" : "Create"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={() => onEdit(suggestion)}
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          onClick={() => onDismiss(suggestion.id)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
