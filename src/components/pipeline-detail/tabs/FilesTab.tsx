import { Upload, FileText, File, Image, FileSpreadsheet, Presentation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassPanel, GlassPanelHeader } from '@/components/ui/glass-panel';

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

export function FilesTab({ companyId }: FilesTabProps) {
  // TODO: Implement file attachments with usePipelineAttachments hook
  // This will be added in Phase 4 with database schema
  
  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <GlassPanel>
        <div className="p-6">
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer">
            <Upload className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">
              Upload files
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Drag and drop or click to browse
            </p>
            <Button variant="outline" size="sm">
              Browse Files
            </Button>
          </div>
        </div>
      </GlassPanel>

      {/* Files List */}
      <GlassPanel>
        <GlassPanelHeader title="Files" />
        <div className="p-4">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground mb-1">
              No files uploaded yet
            </p>
            <p className="text-xs text-muted-foreground">
              Upload a deck, memo, or screenshot to get started.
            </p>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
