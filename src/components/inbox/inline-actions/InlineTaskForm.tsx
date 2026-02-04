import { useState, useEffect } from "react";
import { ListTodo, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import type { InboxItem } from "@/types/inbox";
import type { StructuredSuggestion } from "@/types/inboxSuggestions";

interface TaskFormData {
  title: string;
  description: string;
  companyId?: string;
  companyName?: string;
  companyType?: "portfolio" | "pipeline";
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

export function InlineTaskForm({
  emailItem,
  prefill,
  suggestion,
  onConfirm,
  onCancel,
}: InlineTaskFormProps) {
  const [title, setTitle] = useState(prefill?.title || emailItem.subject || "");
  const [description, setDescription] = useState(prefill?.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when prefill changes (e.g., from suggestion selection)
  useEffect(() => {
    if (prefill?.title) {
      setTitle(prefill.title);
    }
    if (prefill?.description) {
      setDescription(prefill.description);
    }
  }, [prefill?.title, prefill?.description]);

  const handleSubmit = async () => {
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onConfirm({
        title: title.trim(),
        description: description.trim(),
        companyId: prefill?.companyId || emailItem.relatedCompanyId || undefined,
        companyName: prefill?.companyName || emailItem.relatedCompanyName || undefined,
        companyType: emailItem.relatedCompanyType as "portfolio" | "pipeline" | undefined,
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
          <ListTodo className="h-3.5 w-3.5" />
          Create Task
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

          <div>
            <Label htmlFor="task-description" className="text-xs text-muted-foreground">
              Initial note (optional)
            </Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add context or details..."
              className="min-h-[60px] text-sm mt-1 resize-none"
              rows={2}
            />
          </div>

          {/* Company context */}
          {(prefill?.companyName || emailItem.relatedCompanyName) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Linked to:</span>
              <span className="font-medium text-foreground">
                {prefill?.companyName || emailItem.relatedCompanyName}
              </span>
            </div>
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
          Press ⌘+Enter to confirm, Esc to cancel
        </p>
      </div>
    </motion.div>
  );
}
