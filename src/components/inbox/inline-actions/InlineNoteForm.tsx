import { useState } from "react";
import { StickyNote, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import type { InboxItem } from "@/types/inbox";

interface NoteFormData {
  content: string;
  companyId?: string;
}

interface InlineNoteFormProps {
  emailItem: InboxItem;
  onConfirm: (data: NoteFormData) => Promise<void>;
  onCancel: () => void;
}

export function InlineNoteForm({
  emailItem,
  onConfirm,
  onCancel,
}: InlineNoteFormProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await onConfirm({
        content: content.trim(),
        companyId: emailItem.relatedCompanyId || undefined,
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
          <StickyNote className="h-3.5 w-3.5" />
          Add Note
        </div>

        {/* Form fields */}
        <div className="space-y-3" onKeyDown={handleKeyDown}>
          <div>
            <Label htmlFor="note-content" className="text-xs text-muted-foreground">
              Note
            </Label>
            <Textarea
              id="note-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note..."
              className="min-h-[80px] text-sm mt-1 resize-none"
              rows={3}
              autoFocus
            />
          </div>

          {/* Company context */}
          {emailItem.relatedCompanyName && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Will be linked to:</span>
              <span className="font-medium text-foreground">
                {emailItem.relatedCompanyName}
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
              disabled={!content.trim() || isSubmitting}
              className="h-7 text-xs flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Saving...
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
