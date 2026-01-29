import { useState, useMemo, useEffect } from "react";
import { 
  Download, 
  File, 
  FileText, 
  Image as ImageIcon, 
  FileVideo, 
  FileAudio,
  Check,
  Loader2,
  Building2,
  Briefcase,
  Search
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useInboxAttachments, formatFileSize, getFileIcon } from "@/hooks/useInboxAttachments";
import { usePipeline } from "@/hooks/usePipeline";
import { usePortfolioCompanies } from "@/hooks/usePortfolioCompanies";
import { useAuth } from "@/contexts/AuthContext";
import { copyMultipleAttachmentsToPipeline } from "@/lib/inbox/copyAttachmentToCompany";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SaveAttachmentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inboxItemId: string;
  linkedCompanyId?: string;
  linkedCompanyName?: string;
  linkedCompanyType?: 'pipeline' | 'portfolio';
  onLinkCompany?: (companyId: string, companyName: string) => void;
}

interface UnifiedCompany {
  id: string;
  name: string;
  type: 'pipeline' | 'portfolio';
  logo?: string | null;
}

const FileIconComponent = ({ mimeType }: { mimeType: string }) => {
  const iconType = getFileIcon(mimeType);
  const iconClass = "h-5 w-5 text-muted-foreground";
  
  switch (iconType) {
    case "image":
      return <ImageIcon className={iconClass} />;
    case "file-video":
      return <FileVideo className={iconClass} />;
    case "file-audio":
      return <FileAudio className={iconClass} />;
    case "file-text":
      return <FileText className={iconClass} />;
    default:
      return <File className={iconClass} />;
  }
};

export function SaveAttachmentsModal({
  open,
  onOpenChange,
  inboxItemId,
  linkedCompanyId,
  linkedCompanyName,
  linkedCompanyType,
  onLinkCompany,
}: SaveAttachmentsModalProps) {
  const { user } = useAuth();
  const { attachments, isLoading: attachmentsLoading } = useInboxAttachments(open ? inboxItemId : undefined);
  const { companies: pipelineCompanies, loading: pipelineLoading } = usePipeline();
  const { companies: portfolioCompanies, loading: portfolioLoading } = usePortfolioCompanies();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedCompany, setSelectedCompany] = useState<UnifiedCompany | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
  const [step, setStep] = useState<'select-files' | 'select-company'>('select-files');

  // Initialize selected company if linked
  useEffect(() => {
    if (linkedCompanyId && linkedCompanyName && linkedCompanyType) {
      setSelectedCompany({
        id: linkedCompanyId,
        name: linkedCompanyName,
        type: linkedCompanyType,
        logo: null,
      });
    }
  }, [linkedCompanyId, linkedCompanyName, linkedCompanyType]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedIds(new Set());
      setStep('select-files');
      setCompanySearch("");
      if (!linkedCompanyId) {
        setSelectedCompany(null);
      }
    }
  }, [open, linkedCompanyId]);

  const allCompanies = useMemo<UnifiedCompany[]>(() => {
    const pipeline = pipelineCompanies.map(c => ({
      id: c.id,
      name: c.company_name,
      type: 'pipeline' as const,
      logo: c.logo_url,
    }));

    const portfolio = portfolioCompanies.map(c => ({
      id: c.id,
      name: c.name,
      type: 'portfolio' as const,
      logo: c.logo_url,
    }));

    return [...pipeline, ...portfolio];
  }, [pipelineCompanies, portfolioCompanies]);

  const filteredCompanies = useMemo(() => {
    if (!companySearch.trim()) return allCompanies;
    const searchLower = companySearch.toLowerCase();
    return allCompanies.filter(c => c.name.toLowerCase().includes(searchLower));
  }, [allCompanies, companySearch]);

  const toggleAttachment = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === attachments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(attachments.map(a => a.id)));
    }
  };

  const handleSave = async () => {
    if (!selectedCompany || selectedIds.size === 0 || !user) return;

    // Currently only supporting pipeline companies
    if (selectedCompany.type !== 'pipeline') {
      toast.error("Saving to portfolio companies coming soon");
      return;
    }

    setIsSaving(true);

    try {
      const selectedAttachments = attachments.filter(a => selectedIds.has(a.id));
      
      const result = await copyMultipleAttachmentsToPipeline(
        selectedAttachments,
        selectedCompany.id,
        user.id
      );

      if (result.successCount > 0) {
        toast.success(`Saved ${result.successCount} file(s) to ${selectedCompany.name}`);
        
        // Also link the company if not already linked
        if (!linkedCompanyId && onLinkCompany) {
          onLinkCompany(selectedCompany.id, selectedCompany.name);
        }
      }

      if (result.failedCount > 0) {
        toast.error(`Failed to save ${result.failedCount} file(s)`);
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error saving attachments:", error);
      toast.error("Failed to save attachments");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (selectedIds.size === 0) {
      toast.error("Please select at least one file");
      return;
    }

    if (selectedCompany) {
      // Already have a company, go straight to save
      handleSave();
    } else {
      // Need to select a company first
      setStep('select-company');
    }
  };

  const handleBack = () => {
    setStep('select-files');
  };

  const handleCompanySelect = (company: UnifiedCompany) => {
    setSelectedCompany(company);
  };

  const isLoading = attachmentsLoading || pipelineLoading || portfolioLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-muted-foreground" />
            {step === 'select-files' ? 'Save Attachments' : 'Select Company'}
          </DialogTitle>
        </DialogHeader>

        {step === 'select-files' ? (
          <>
            {/* Selected company indicator */}
            {selectedCompany && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm">
                <Check className="h-4 w-4 text-emerald-500" />
                <span className="text-muted-foreground">Saving to:</span>
                <span className="font-medium">{selectedCompany.name}</span>
                {!linkedCompanyId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 ml-auto text-xs"
                    onClick={() => setSelectedCompany(null)}
                  >
                    Change
                  </Button>
                )}
              </div>
            )}

            {/* Select all toggle */}
            {attachments.length > 0 && (
              <div className="flex items-center justify-between py-2 border-b">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={selectedIds.size === attachments.length}
                    onCheckedChange={toggleAll}
                  />
                  Select all ({attachments.length} files)
                </label>
              </div>
            )}

            {/* Attachment list */}
            <ScrollArea className="h-[250px] -mx-2 px-2">
              {isLoading ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Loading...
                </div>
              ) : attachments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <File className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No attachments</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {attachments.map((attachment) => (
                    <label
                      key={attachment.id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                        selectedIds.has(attachment.id)
                          ? "bg-primary/10"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <Checkbox
                        checked={selectedIds.has(attachment.id)}
                        onCheckedChange={() => toggleAttachment(attachment.id)}
                      />
                      <FileIconComponent mimeType={attachment.mimeType} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {attachment.filename}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(attachment.sizeBytes)}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleNext} 
                disabled={selectedIds.size === 0 || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : selectedCompany ? (
                  `Save ${selectedIds.size} File(s)`
                ) : (
                  "Next: Select Company"
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Company search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>

            {/* Company list */}
            <ScrollArea className="h-[280px] -mx-2 px-2">
              {isLoading ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Loading companies...
                </div>
              ) : filteredCompanies.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Building2 className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No companies found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Pipeline */}
                  {filteredCompanies.filter(c => c.type === 'pipeline').length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <Briefcase className="h-3 w-3" />
                        Pipeline
                      </div>
                      <div className="space-y-1">
                        {filteredCompanies
                          .filter(c => c.type === 'pipeline')
                          .map((company) => (
                            <button
                              key={company.id}
                              type="button"
                              onClick={() => handleCompanySelect(company)}
                              className={cn(
                                "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors",
                                selectedCompany?.id === company.id
                                  ? "bg-primary/10 ring-1 ring-primary"
                                  : "hover:bg-muted/50"
                              )}
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={company.logo || undefined} />
                                <AvatarFallback className="text-xs bg-muted">
                                  {company.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium truncate flex-1">
                                {company.name}
                              </span>
                              {selectedCompany?.id === company.id && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Portfolio */}
                  {filteredCompanies.filter(c => c.type === 'portfolio').length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <Building2 className="h-3 w-3" />
                        Portfolio
                        <Badge variant="outline" className="text-[9px] ml-1">
                          Coming soon
                        </Badge>
                      </div>
                      <div className="space-y-1 opacity-50">
                        {filteredCompanies
                          .filter(c => c.type === 'portfolio')
                          .map((company) => (
                            <div
                              key={company.id}
                              className="flex items-center gap-3 p-2 rounded-lg"
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={company.logo || undefined} />
                                <AvatarFallback className="text-xs bg-muted">
                                  {company.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium truncate">
                                {company.name}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Actions */}
            <div className="flex justify-between gap-2 pt-2 border-t">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!selectedCompany || selectedCompany.type !== 'pipeline' || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  `Save ${selectedIds.size} File(s)`
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
