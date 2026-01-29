import { useState } from "react";
import { Paperclip, Download, Eye, FileText, Image, FileVideo, FileAudio, File, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTaskAttachments } from "@/hooks/useTaskAttachments";
import { formatFileSize, getFileIcon, canPreviewInline } from "@/hooks/useInboxAttachments";
import { cn } from "@/lib/utils";

interface TaskAttachmentsSectionProps {
  taskId: string;
}

const FILE_ICONS = {
  file: File,
  image: Image,
  "file-text": FileText,
  "file-video": FileVideo,
  "file-audio": FileAudio,
};

export function TaskAttachmentsSection({ taskId }: TaskAttachmentsSectionProps) {
  const { attachments, sourceInboxItemId, isLoading, getSignedUrl } = useTaskAttachments(taskId);
  const [loadingUrls, setLoadingUrls] = useState<Record<string, boolean>>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string | null>(null);

  // Don't render if task has no source inbox item
  if (!sourceInboxItemId && !isLoading) {
    return null;
  }

  // Don't render if no attachments
  if (!isLoading && attachments.length === 0) {
    return null;
  }

  const handleDownload = async (storagePath: string, filename: string) => {
    setLoadingUrls((prev) => ({ ...prev, [storagePath]: true }));
    try {
      const url = await getSignedUrl(storagePath);
      if (url) {
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } finally {
      setLoadingUrls((prev) => ({ ...prev, [storagePath]: false }));
    }
  };

  const handlePreview = async (storagePath: string, mimeType: string) => {
    setLoadingUrls((prev) => ({ ...prev, [storagePath]: true }));
    try {
      const url = await getSignedUrl(storagePath);
      if (url) {
        setPreviewUrl(url);
        setPreviewType(mimeType);
      }
    } finally {
      setLoadingUrls((prev) => ({ ...prev, [storagePath]: false }));
    }
  };

  const closePreview = () => {
    setPreviewUrl(null);
    setPreviewType(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading attachments...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Paperclip className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-medium text-foreground">Source Attachments</h4>
        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
          {attachments.length}
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground">
        These files are from the email this task was created from.
      </p>

      <div className="space-y-2">
        {attachments.map((attachment) => {
          const iconType = getFileIcon(attachment.mimeType);
          const IconComponent = FILE_ICONS[iconType];
          const isLoadingUrl = loadingUrls[attachment.storagePath];
          const canPreview = canPreviewInline(attachment.mimeType);

          return (
            <div
              key={attachment.id}
              className={cn(
                "flex items-center gap-3 p-2.5 rounded-lg border border-border",
                "bg-muted/30 hover:bg-muted/50 transition-colors"
              )}
            >
              <div className="w-8 h-8 rounded-md bg-background flex items-center justify-center flex-shrink-0">
                <IconComponent className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {attachment.filename}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.sizeBytes)}
                </p>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {canPreview && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handlePreview(attachment.storagePath, attachment.mimeType)}
                    disabled={isLoadingUrl}
                    title="Preview"
                  >
                    {isLoadingUrl ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleDownload(attachment.storagePath, attachment.filename)}
                  disabled={isLoadingUrl}
                  title="Download"
                >
                  {isLoadingUrl && !canPreview ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={closePreview}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] overflow-auto bg-background rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between p-3 border-b border-border bg-background">
              <span className="text-sm font-medium">Preview</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(previewUrl, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open in new tab
                </Button>
                <Button variant="ghost" size="sm" onClick={closePreview}>
                  Close
                </Button>
              </div>
            </div>
            <div className="p-4">
              {previewType?.startsWith("image/") ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-full h-auto rounded"
                />
              ) : previewType === "application/pdf" ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-[70vh] rounded"
                  title="PDF Preview"
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
