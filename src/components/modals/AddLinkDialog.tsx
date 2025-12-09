import { LinkIcon, Loader2, Folder } from "lucide-react";
import { GlassModal, GlassModalContent, GlassModalHeader, GlassModalTitle, GlassModalFooter } from "@/components/ui/GlassModal";
import { Button } from "@/components/ui/button";
import { ReadingItem } from "@/types/readingItem";
import { LinkMetadataPreview } from "./add-link/LinkMetadataPreview";
import { LinkInputField } from "./add-link/LinkInputField";
import { useAddLinkForm } from "@/hooks/useAddLinkForm";
import { useProjects } from "@/hooks/useProjects";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface AddLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddLink: (linkData: Omit<ReadingItem, 'id'>) => void;
}

export function AddLinkDialog({ open, onOpenChange, onAddLink }: AddLinkDialogProps) {
  const {
    url,
    isLoading,
    metadata,
    fetchingMetadata,
    projectId,
    setProjectId,
    setIsLoading,
    resetForm,
    handleUrlChange,
    createLinkData,
    validateUrl
  } = useAddLinkForm();
  
  const { projects, loading: projectsLoading } = useProjects();

  const handleSubmit = async () => {
    if (!validateUrl(url)) return;

    try {
      setIsLoading(true);
      const linkData = createLinkData(url, metadata);
      onAddLink(linkData);
      toast.success("Link added to reading list");
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error adding link:", error);
      toast.error("Failed to add link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit();
  };

  return (
    <GlassModal open={open} onOpenChange={onOpenChange}>
      <GlassModalContent className="max-w-lg">
        <GlassModalHeader>
          <GlassModalTitle className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" /> Add to Reading List
          </GlassModalTitle>
        </GlassModalHeader>
        
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <LinkInputField
            url={url}
            onUrlChange={handleUrlChange}
            isLoading={isLoading}
            fetchingMetadata={fetchingMetadata}
          />

          {metadata && <LinkMetadataPreview metadata={metadata} />}
          
          {/* Project Selector */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5" />
              Project (optional)
            </Label>
            <Select
              value={projectId || "none"}
              onValueChange={(value) => setProjectId(value === "none" ? undefined : value)}
              disabled={projectsLoading}
            >
              <SelectTrigger className="w-full bg-background/50">
                <SelectValue placeholder="Select a project..." />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border z-50">
                <SelectItem value="none">No project</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-2">
                      {project.color && (
                        <div 
                          className="w-2 h-2 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: project.color }}
                        />
                      )}
                      <span>{project.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </form>

        <GlassModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!url || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Link"
            )}
          </Button>
        </GlassModalFooter>
      </GlassModalContent>
    </GlassModal>
  );
}
