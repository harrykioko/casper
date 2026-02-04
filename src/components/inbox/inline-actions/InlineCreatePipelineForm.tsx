import { useState, useEffect } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import type { InboxItem } from "@/types/inbox";
import type { StructuredSuggestion } from "@/types/inboxSuggestions";
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
  prefill?: {
    companyName?: string;
    domain?: string;
    contactName?: string;
    contactEmail?: string;
    notes?: string;
    source?: string;
    rationale?: string;
    confidence?: string;
  };
  suggestion?: StructuredSuggestion | null;
  onConfirm: (data: PipelineFormData) => Promise<void>;
  onCancel: () => void;
}

export function InlineCreatePipelineForm({
  emailItem,
  prefill,
  suggestion,
  onConfirm,
  onCancel,
}: InlineCreatePipelineFormProps) {
  const [companyName, setCompanyName] = useState(prefill?.companyName || "");
  const [domain, setDomain] = useState(prefill?.domain || "");
  const [stage, setStage] = useState<RoundEnum>("Seed");
  const [contactName, setContactName] = useState(prefill?.contactName || "");
  const [contactEmail, setContactEmail] = useState(prefill?.contactEmail || "");
  const [notes, setNotes] = useState(prefill?.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract source from email context
  const defaultSource = emailItem.senderName || emailItem.senderEmail || "";

  // Update form when prefill changes (e.g., from suggestion selection)
  useEffect(() => {
    if (prefill?.companyName) setCompanyName(prefill.companyName);
    if (prefill?.domain) setDomain(prefill.domain);
    if (prefill?.contactName) setContactName(prefill.contactName);
    if (prefill?.contactEmail) setContactEmail(prefill.contactEmail);
    if (prefill?.notes) setNotes(prefill.notes);
  }, [prefill]);

  const handleSubmit = async () => {
    if (!companyName.trim()) return;

    setIsSubmitting(true);
    try {
      await onConfirm({
        companyName: companyName.trim(),
        domain: domain.trim() || undefined,
        stage,
        source: prefill?.source || defaultSource,
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

        {/* Suggestion rationale */}
        {suggestion && (
          <div className="p-2 rounded bg-muted/50 border border-muted">
            <p className="text-[10px] text-muted-foreground italic">
              {suggestion.rationale}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] text-muted-foreground">
                Confidence: <span className="capitalize">{suggestion.confidence}</span>
              </span>
            </div>
          </div>
        )}

        {/* Form fields */}
        <div className="space-y-3" onKeyDown={handleKeyDown}>
          {/* Company Name */}
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

          {/* Domain + Stage row */}
          <div className="grid grid-cols-2 gap-2">
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
          </div>

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

          {/* Notes */}
          <div>
            <Label htmlFor="pipeline-notes" className="text-xs text-muted-foreground">
              Notes (optional)
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
          Press ⌘+Enter to confirm, Esc to cancel
        </p>
      </div>
    </motion.div>
  );
}
