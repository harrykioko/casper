import { useState, useRef } from 'react';
import { Upload, FileText, File, Image, FileSpreadsheet, Presentation, Download, Trash2, Loader2, Eye, EyeOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassPanel, GlassPanelHeader, GlassSubcard } from '@/components/ui/glass-panel';
import { usePipelineAttachments, PipelineAttachment, canPreviewInline } from '@/hooks/usePipelineAttachments';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface FilesTabProps {
  companyId: string;
}

// File type icon mapping
function getFileIcon(fileType: string | null) {
  if (!fileType) return File;
  if (fileType.startsWith('image/')) return Image;
  if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('csv')) return FileSpreadsheet;
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return Presentation;
  if (fileType.includes('pdf') || fileType.includes('document') || fileType.includes('word')) return FileText;
  return File;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Inline preview component
function AttachmentPreview({ 
  attachment, 
  signedUrl, 
  onClose 
}: { 
  attachment: PipelineAttachment; 
  signedUrl: string;
  onClose: () => void;
}) {
  const isImage = attachment.file_type?.startsWith("image/");
  const isPdf = attachment.file_type === "application/pdf";

  return (
    <div className="relative mt-2 rounded-lg border border-border overflow-hidden bg-muted/30">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 bg-background/80 hover:bg-background z-10"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>

      {isImage && (
        <img 
          src={signedUrl} 
          alt={attachment.file_name}
          className="max-w-full max-h-[400px] object-contain mx-auto p-4"
        />
      )}

      {isPdf && (
        <iframe
          src={signedUrl}
          title={attachment.file_name}
          className="w-full h-[500px] border-0"
        />
      )}
    </div>
  );
}

export function FilesTab({ companyId }: FilesTabProps) {
  const { attachments, loading, uploadAttachment, deleteAttachment, getSignedUrl } = usePipelineAttachments(companyId);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewAttachmentId, setPreviewAttachmentId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          continue; // Skip files > 10MB
        }
        await uploadAttachment(file);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (attachment: PipelineAttachment) => {
    setDownloadingId(attachment.id);
    try {
      const url = await getSignedUrl(attachment.storage_path);
      if (url) {
        window.open(url, '_blank');
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (attachment: PipelineAttachment) => {
    if (!confirm(`Delete "${attachment.file_name}"?`)) return;
    
    setDeletingId(attachment.id);
    try {
      await deleteAttachment(attachment);
    } finally {
      setDeletingId(null);
    }
  };

  const handlePreview = async (attachment: PipelineAttachment) => {
    if (previewAttachmentId === attachment.id) {
      // Close preview
      setPreviewAttachmentId(null);
      setPreviewUrl(null);
    } else {
      // Open preview
      const url = await getSignedUrl(attachment.storage_path);
      if (url) {
        setPreviewAttachmentId(attachment.id);
        setPreviewUrl(url);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <GlassPanel>
        <div className="p-6">
          <div
            className={cn(
              "border-2 border-dashed border-border rounded-xl p-8 text-center transition-colors cursor-pointer",
              "bg-muted/20 hover:bg-muted/30",
              uploading && "pointer-events-none opacity-60"
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3 animate-spin" />
            ) : (
              <Upload className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            )}
            <p className="text-sm font-medium text-foreground mb-1">
              {uploading ? 'Uploading...' : 'Upload files'}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Drag and drop or click to browse (max 10 MB per file)
            </p>
            <Button variant="outline" size="sm" disabled={uploading}>
              Browse Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      </GlassPanel>

      {/* Files List */}
      <GlassPanel>
        <GlassPanelHeader title={`Files (${attachments.length})`} />
        <div className="p-4">
          {attachments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground mb-1">
                No files uploaded yet
              </p>
              <p className="text-xs text-muted-foreground">
                Upload a deck, memo, or screenshot to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {attachments.map((attachment) => {
                const FileIcon = getFileIcon(attachment.file_type);
                const isDownloading = downloadingId === attachment.id;
                const isDeleting = deletingId === attachment.id;
                const isPreviewOpen = previewAttachmentId === attachment.id;
                const canPreview = canPreviewInline(attachment.file_type);

                return (
                  <div key={attachment.id}>
                    <GlassSubcard className="p-3" hoverable={false}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                          <FileIcon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {attachment.file_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(attachment.file_size)} • {format(new Date(attachment.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          {canPreview && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handlePreview(attachment)}
                              title={isPreviewOpen ? "Hide preview" : "Preview"}
                            >
                              {isPreviewOpen ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDownload(attachment)}
                            disabled={isDownloading}
                          >
                            {isDownloading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(attachment)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </GlassSubcard>
                    
                    {isPreviewOpen && previewUrl && (
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
                );
              })}
            </div>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}
