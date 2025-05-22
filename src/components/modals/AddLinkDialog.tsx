
import { useState } from "react";
import { LinkIcon, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReadingItem } from "@/components/dashboard/ReadingList";
import { toast } from "sonner";

interface AddLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddLink: (linkData: Omit<ReadingItem, 'id'>) => void;
}

export function AddLinkDialog({ open, onOpenChange, onAddLink }: AddLinkDialogProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [metadata, setMetadata] = useState<{
    title?: string;
    description?: string;
    favicon?: string;
  }>({});

  const resetForm = () => {
    setUrl("");
    setMetadata({});
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) return;

    // Basic URL validation
    try {
      new URL(url);
    } catch (e) {
      toast.error("Please enter a valid URL");
      return;
    }

    try {
      setIsLoading(true);
      
      // In a real app, we would fetch metadata from a backend service
      // For now, we'll simulate a delay and generate some fake metadata
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newLink: Omit<ReadingItem, 'id'> = {
        url,
        title: metadata.title || url,
        description: metadata.description,
        favicon: metadata.favicon,
        isRead: false
      };

      onAddLink(newLink);
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

  const handleUrlBlur = async () => {
    if (!url) return;
    
    try {
      // Validate URL
      new URL(url);
      
      setIsLoading(true);
      
      // In a real app, we would fetch metadata from a backend
      // For now, simulate fetching metadata with a delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Generate fake metadata based on the domain
      const domain = new URL(url).hostname;
      setMetadata({
        title: `Content from ${domain}`,
        description: `This is a webpage from ${domain} that you've saved to read later.`,
        favicon: `https://${domain}/favicon.ico`
      });
    } catch (error) {
      // Invalid URL or error fetching metadata
      console.error("Error fetching metadata:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" /> Add to Reading List
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Input
                placeholder="Enter URL (https://...)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={handleUrlBlur}
                className="pr-10"
                disabled={isLoading}
                autoFocus
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
            </div>
            
            {metadata.title && (
              <div className="p-3 border rounded-md bg-muted/30 space-y-2">
                <p className="text-sm font-medium line-clamp-1">{metadata.title}</p>
                {metadata.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {metadata.description}
                  </p>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter className="sm:justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!url || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Add Link"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
