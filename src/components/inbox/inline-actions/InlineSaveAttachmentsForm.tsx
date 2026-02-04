import { useState, useMemo, useEffect } from "react";
import { Download, Loader2, FileIcon, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useInboxAttachments, type InboxAttachment } from "@/hooks/useInboxAttachments";
import type { InboxItem } from "@/types/inbox";

interface InlineSaveAttachmentsFormProps {
  emailItem: InboxItem;
  onConfirm: (attachments: InboxAttachment[]) => Promise<void>;
  onCancel: () => void;
  onLinkCompanyFirst?: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function InlineSaveAttachmentsForm({
  emailItem,
  onConfirm,
  onCancel,
  onLinkCompanyFirst,
}: InlineSaveAttachmentsFormProps) {
  const { attachments, isLoading } = useInboxAttachments(emailItem.id);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Select all by default when attachments load (only once)
  useEffect(() => {
    if (attachments.length > 0 && !hasInitialized) {
      setSelectedIds(new Set(attachments.map((a) => a.id)));
      setHasInitialized(true);
    }
  }, [attachments, hasInitialized]);

  const toggleAttachment = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedAttachments = useMemo(() => 
    attachments.filter((a) => selectedIds.has(a.id)),
    [attachments, selectedIds]
  );

  const handleSubmit = async () => {
    if (selectedAttachments.length === 0) return;

    setIsSubmitting(true);
    try {
      await onConfirm(selectedAttachments);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  // If no company is linked, show message to link first
  const needsCompany = !emailItem.relatedCompanyId;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="p-3 rounded-lg border border-border bg-background space-y-3" onKeyDown={handleKeyDown}>
        {/* Header */}
        <div className="flex items-center gap-2 text-xs font-medium text-foreground">
          <Download className="h-3.5 w-3.5" />
          Save Attachments to Company
        </div>

        {/* Needs company warning */}
        {needsCompany && (
          <div className="p-2 rounded bg-muted border border-border">
            <p className="text-[10px] text-muted-foreground">
              Link a company first to save attachments
            </p>
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[10px] mt-2"
              onClick={onLinkCompanyFirst}
            >
              <Building2 className="h-3 w-3 mr-1" />
              Link Company
            </Button>
          </div>
        )}

        {/* Target company */}
        {!needsCompany && emailItem.relatedCompanyName && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Save to:</span>
            <span className="font-medium text-foreground">
              {emailItem.relatedCompanyName}
            </span>
          </div>
        )}

        {/* Attachments list */}
        {!needsCompany && (
          <ScrollArea className="h-[160px] border border-border rounded-md">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </div>
            ) : attachments.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                No attachments found
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {attachments.map((attachment) => (
                  <label
                    key={attachment.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-accent transition-colors",
                      selectedIds.has(attachment.id) && "bg-accent/50"
                    )}
                  >
                    <Checkbox
                      checked={selectedIds.has(attachment.id)}
                      onCheckedChange={() => toggleAttachment(attachment.id)}
                    />
                    <div className="w-7 h-7 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <FileIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{attachment.filename}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatFileSize(attachment.sizeBytes)}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </ScrollArea>
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
            disabled={needsCompany || selectedAttachments.length === 0 || isSubmitting}
            className="h-7 text-xs flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Saving...
              </>
            ) : (
              `Save ${selectedAttachments.length} file${selectedAttachments.length !== 1 ? "s" : ""}`
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
