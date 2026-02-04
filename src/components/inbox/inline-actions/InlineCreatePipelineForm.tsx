import { useState, useEffect } from "react";
import { Plus, Loader2, ChevronDown, ChevronUp, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { InboxItem } from "@/types/inbox";
import type { StructuredSuggestion } from "@/types/inboxSuggestions";
import type { PipelineCompanyDraft, ConfidenceLevel } from "@/types/emailActionDrafts";
import type { RoundEnum } from "@/types/pipeline";

const ROUND_OPTIONS: RoundEnum[] = [
  "Seed",
  "Series A",
  "Series B",
  "Series C",
  "Series D",
  "Series E",
  "Series F+",
];

export interface PipelineFormData {
  companyName: string;
  domain?: string;
  stage: RoundEnum;
  source?: string;
  contactName?: string;
  contactEmail?: string;
  notes?: string;
}

interface InlineCreatePipelineFormProps {
  emailItem: InboxItem;
  prefill?: Partial<PipelineCompanyDraft> & {
    rationale?: string;
    confidence?: string;
  };
  suggestion?: StructuredSuggestion | null;
  onConfirm: (data: PipelineFormData) => Promise<void>;
  onCancel: () => void;
}

/**
 * Suggestion chip component for displaying AI-inferred values
 */
function SuggestionChip({
  label,
  value,
  confidence,
  onClear,
  className,
}: {
  label: string;
  value: string;
  confidence?: ConfidenceLevel;
  onClear: () => void;
  className?: string;
}) {
  if (!value) return null;
  
  return (
    <Badge
      variant="secondary"
      className={cn(
        "h-6 px-2 gap-1.5 text-xs font-normal bg-primary/10 text-primary hover:bg-primary/15 cursor-default",
        className
      )}
    >
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium truncate max-w-[120px]">{value}</span>
      {confidence === "suggested" && (
        <Sparkles className="h-3 w-3 text-primary/60 flex-shrink-0" />
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClear();
        }}
        className="ml-0.5 hover:text-destructive transition-colors"
        aria-label={`Clear ${label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}

export function InlineCreatePipelineForm({
  emailItem,
  prefill,
  suggestion,
  onConfirm,
  onCancel,
}: InlineCreatePipelineFormProps) {
  // Core fields
  const [companyName, setCompanyName] = useState(prefill?.companyName || "");
  const [domain, setDomain] = useState(prefill?.domain || "");
  const [contactName, setContactName] = useState(
    prefill?.contacts?.[0]?.name || emailItem.senderName || ""
  );
  const [contactEmail, setContactEmail] = useState(
    prefill?.contacts?.[0]?.email || emailItem.senderEmail || ""
  );
  const [notes, setNotes] = useState(prefill?.contextSummary || "");
  
  // Advanced fields
  const [stage, setStage] = useState<RoundEnum>(
    (prefill?.suggestedStage as RoundEnum) || "Seed"
  );
  
  // UI state
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Track which suggested values are still "active" (not cleared by user)
  const [activeSuggestions, setActiveSuggestions] = useState<Set<string>>(
    new Set(["domain", "stage"])
  );

  // Extract source from email context
  const defaultSource = prefill?.introSource || emailItem.senderName || emailItem.senderEmail || "";

  // Update form when prefill changes (e.g., from suggestion selection)
  useEffect(() => {
    if (prefill?.companyName) setCompanyName(prefill.companyName);
    if (prefill?.domain) setDomain(prefill.domain);
    if (prefill?.contacts?.[0]?.name) setContactName(prefill.contacts[0].name);
    if (prefill?.contacts?.[0]?.email) setContactEmail(prefill.contacts[0].email);
    if (prefill?.contextSummary) setNotes(prefill.contextSummary);
    if (prefill?.suggestedStage) setStage(prefill.suggestedStage as RoundEnum);
    
    // Reset active suggestions when prefill changes
    setActiveSuggestions(new Set(["domain", "stage"]));
  }, [prefill]);

  const handleClearSuggestion = (field: string) => {
    setActiveSuggestions(prev => {
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
    
    // Clear the actual field value
    if (field === "domain") setDomain("");
    if (field === "stage") setStage("Seed");
  };

  const handleSubmit = async () => {
    if (!companyName.trim()) return;

    setIsSubmitting(true);
    try {
      await onConfirm({
        companyName: companyName.trim(),
        domain: domain.trim() || undefined,
        stage,
        source: defaultSource,
        contactName: contactName.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        notes: notes.trim() || undefined,
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

  // Check if we have suggested values to show as chips
  const hasSuggestedDomain = domain && activeSuggestions.has("domain") && prefill?.domainConfidence === "suggested";
  const hasSuggestedStage = activeSuggestions.has("stage") && prefill?.suggestedStage;

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
          <Plus className="h-3.5 w-3.5" />
          Add to Pipeline
        </div>

        {/* AI Rationale (if from suggestion) */}
        {(prefill?.rationale || suggestion?.rationale) && (
          <div className="p-2 rounded bg-muted/50 border border-muted">
            <p className="text-[10px] text-muted-foreground italic leading-relaxed">
              {prefill?.rationale || suggestion?.rationale}
            </p>
          </div>
        )}

        {/* Form fields */}
        <div className="space-y-3" onKeyDown={handleKeyDown}>
          {/* Company Name - always visible */}
          <div>
            <Label htmlFor="pipeline-company-name" className="text-xs text-muted-foreground">
              Company Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pipeline-company-name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g., Acme Inc"
              className="h-8 text-sm mt-1"
              autoFocus
            />
          </div>

          {/* Suggestion chips row */}
          {(hasSuggestedDomain || hasSuggestedStage) && (
            <div className="flex flex-wrap gap-1.5">
              {hasSuggestedDomain && (
                <SuggestionChip
                  label="Domain"
                  value={domain}
                  confidence="suggested"
                  onClear={() => handleClearSuggestion("domain")}
                />
              )}
              {hasSuggestedStage && (
                <SuggestionChip
                  label="Stage"
                  value={stage}
                  confidence="suggested"
                  onClear={() => handleClearSuggestion("stage")}
                />
              )}
            </div>
          )}

          {/* Domain input (only if not shown as chip) */}
          {!hasSuggestedDomain && (
            <div>
              <Label htmlFor="pipeline-domain" className="text-xs text-muted-foreground">
                Domain
              </Label>
              <Input
                id="pipeline-domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="acme.com"
                className="h-8 text-sm mt-1"
              />
            </div>
          )}

          {/* Primary Contact Section */}
          <div className="pt-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Primary Contact
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="pipeline-contact-name" className="text-xs text-muted-foreground">
                  Name
                </Label>
                <Input
                  id="pipeline-contact-name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Jane Doe"
                  className="h-8 text-sm mt-1"
                />
              </div>
              <div>
                <Label htmlFor="pipeline-contact-email" className="text-xs text-muted-foreground">
                  Email
                </Label>
                <Input
                  id="pipeline-contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="jane@acme.com"
                  className="h-8 text-sm mt-1"
                />
              </div>
            </div>
          </div>

          {/* Context Notes */}
          <div>
            <Label htmlFor="pipeline-notes" className="text-xs text-muted-foreground">
              Context Notes
            </Label>
            <Textarea
              id="pipeline-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add context, intro source, or deal notes..."
              className="min-h-[60px] text-sm mt-1 resize-none"
              rows={2}
            />
          </div>

          {/* More Details - Collapsible */}
          <Collapsible open={showMoreDetails} onOpenChange={setShowMoreDetails}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground w-full justify-start"
              >
                {showMoreDetails ? (
                  <ChevronUp className="h-3.5 w-3.5 mr-1.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 mr-1.5" />
                )}
                {showMoreDetails ? "Hide details" : "More details"}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-3">
              {/* Stage selector (if not shown as chip) */}
              {!hasSuggestedStage && (
                <div>
                  <Label htmlFor="pipeline-stage" className="text-xs text-muted-foreground">
                    Stage
                  </Label>
                  <Select value={stage} onValueChange={(val) => setStage(val as RoundEnum)}>
                    <SelectTrigger className="h-8 text-sm mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROUND_OPTIONS.map((round) => (
                        <SelectItem key={round} value={round}>
                          {round}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Key Points Preview (if available) */}
              {prefill?.keyPoints && prefill.keyPoints.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                    Key Points from Email
                  </p>
                  <ul className="text-[11px] text-muted-foreground space-y-1 list-disc list-inside">
                    {prefill.keyPoints.slice(0, 3).map((point, idx) => (
                      <li key={idx} className="truncate">{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Intro Source */}
              {defaultSource && (
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Source
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {defaultSource}
                  </p>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

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
              disabled={!companyName.trim() || isSubmitting}
              className="h-7 text-xs flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Creating...
                </>
              ) : (
                "Add to Pipeline"
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
