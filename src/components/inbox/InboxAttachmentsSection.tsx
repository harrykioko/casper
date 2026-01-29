import { useState } from "react";
import { Download, FileText, Image, File, FileVideo, FileAudio, Eye, EyeOff, X, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  useInboxAttachments, 
  formatFileSize, 
  getFileIcon, 
  canPreviewInline,
  type InboxAttachment 
} from "@/hooks/useInboxAttachments";
import { cn } from "@/lib/utils";

interface InboxAttachmentsSectionProps {
  inboxItemId: string;
  linkedCompanyId?: string;
  linkedCompanyName?: string;
  onSaveToCompany?: (attachment: InboxAttachment) => void;
}

const FileIconMap = {
  file: File,
  image: Image,
  "file-text": FileText,
  "file-video": FileVideo,
  "file-audio": FileAudio,
};

function AttachmentCard({ 
  attachment, 
  onDownload, 
  onPreview,
  onSaveToCompany,
  isPreviewOpen,
  linkedCompanyId,
  linkedCompanyName,
  isSaving,
}: { 
  attachment: InboxAttachment; 
  onDownload: () => void;
  onPreview?: () => void;
  onSaveToCompany?: () => void;
  isPreviewOpen?: boolean;
  linkedCompanyId?: string;
  linkedCompanyName?: string;
  isSaving?: boolean;
}) {
  const iconType = getFileIcon(attachment.mimeType);
  const IconComponent = FileIconMap[iconType];
  const canPreview = canPreviewInline(attachment.mimeType);

  const saveTooltip = linkedCompanyName 
    ? `Save to ${linkedCompanyName}` 
    : "Save to company...";

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-background/50 hover:bg-muted/50 transition-colors">
      <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
        <IconComponent className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">
          {attachment.filename}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {formatFileSize(attachment.sizeBytes)}
        </p>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {canPreview && onPreview && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onPreview}
            title={isPreviewOpen ? "Hide preview" : "Preview"}
          >
            {isPreviewOpen ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onDownload}
          title="Download"
        >
          <Download className="h-3.5 w-3.5" />
        </Button>
        {onSaveToCompany && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onSaveToCompany}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Building2 className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{saveTooltip}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

function AttachmentPreview({ 
  attachment, 
  signedUrl, 
  onClose 
}: { 
  attachment: InboxAttachment; 
  signedUrl: string;
  onClose: () => void;
}) {
  const isImage = attachment.mimeType.startsWith("image/");
  const isPdf = attachment.mimeType === "application/pdf";

  return (
    <div className="relative mt-2 rounded-lg border border-border overflow-hidden bg-muted/30">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 bg-background/80 hover:bg-background z-10"
        onClick={onClose}
      >
        <X className="h-3.5 w-3.5" />
      </Button>

      {isImage && (
        <img 
          src={signedUrl} 
          alt={attachment.filename}
          className="max-w-full max-h-[300px] object-contain mx-auto"
        />
      )}

      {isPdf && (
        <iframe
          src={signedUrl}
          title={attachment.filename}
          className="w-full h-[400px] border-0"
        />
      )}
    </div>
  );
}

export function InboxAttachmentsSection({ 
  inboxItemId,
  linkedCompanyId,
  linkedCompanyName,
  onSaveToCompany,
}: InboxAttachmentsSectionProps) {
  const { attachments, isLoading, getSignedUrl } = useInboxAttachments(inboxItemId);
  const [previewAttachmentId, setPreviewAttachmentId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [savingAttachmentId, setSavingAttachmentId] = useState<string | null>(null);

  const handleDownload = async (attachment: InboxAttachment) => {
    const url = await getSignedUrl(attachment.storagePath);
    if (url) {
      // Create a temporary link and click it to trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePreview = async (attachment: InboxAttachment) => {
    if (previewAttachmentId === attachment.id) {
      // Close preview
      setPreviewAttachmentId(null);
      setPreviewUrl(null);
    } else {
      // Open preview
      const url = await getSignedUrl(attachment.storagePath);
      if (url) {
        setPreviewAttachmentId(attachment.id);
        setPreviewUrl(url);
      }
    }
  };

  const handleSaveToCompany = async (attachment: InboxAttachment) => {
    if (!onSaveToCompany) return;
    setSavingAttachmentId(attachment.id);
    try {
      await onSaveToCompany(attachment);
    } finally {
      setSavingAttachmentId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Attachments
        </h3>
        <div className="h-12 bg-muted/30 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Attachments ({attachments.length})
      </h3>
      
      <div className="space-y-2">
        {attachments.map((attachment) => (
          <div key={attachment.id}>
            <AttachmentCard
              attachment={attachment}
              onDownload={() => handleDownload(attachment)}
              onPreview={canPreviewInline(attachment.mimeType) ? () => handlePreview(attachment) : undefined}
              onSaveToCompany={onSaveToCompany ? () => handleSaveToCompany(attachment) : undefined}
              isPreviewOpen={previewAttachmentId === attachment.id}
              linkedCompanyId={linkedCompanyId}
              linkedCompanyName={linkedCompanyName}
              isSaving={savingAttachmentId === attachment.id}
            />
            
            {previewAttachmentId === attachment.id && previewUrl && (
              <AttachmentPreview
                attachment={attachment}
                signedUrl={previewUrl}
                onClose={() => {
                  setPreviewAttachmentId(null);
                  setPreviewUrl(null);
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
