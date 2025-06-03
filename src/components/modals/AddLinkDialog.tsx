
import { useState } from "react";
import { LinkIcon, Loader2, ExternalLink } from "lucide-react";
import { GlassModal, GlassModalContent, GlassModalHeader, GlassModalTitle, GlassModalFooter } from "@/components/ui/GlassModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReadingItem } from "@/types/readingItem";
import { fetchLinkMetadata } from "@/hooks/useReadingItems";
import { toast } from "sonner";

interface LinkMetadata {
  title: string;
  description?: string;
  image?: string;
  favicon?: string;
  hostname?: string;
  url: string;
}

interface AddLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddLink: (linkData: Omit<ReadingItem, 'id'>) => void;
}

export function AddLinkDialog({ open, onOpenChange, onAddLink }: AddLinkDialogProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [metadata, setMetadata] = useState<LinkMetadata | null>(null);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);

  const resetForm = () => {
    setUrl("");
    setMetadata(null);
    setIsLoading(false);
    setFetchingMetadata(false);
  };

  const handleUrlChange = async (value: string) => {
    setUrl(value);
    setMetadata(null);

    if (value && (value.startsWith('http://') || value.startsWith('https://'))) {
      try {
        setFetchingMetadata(true);
        const fetchedMetadata = await fetchLinkMetadata(value);
        setMetadata(fetchedMetadata);
      } catch (error) {
        console.error("Error fetching metadata:", error);
      } finally {
        setFetchingMetadata(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!url) return;

    try {
      new URL(url);
    } catch (e) {
      toast.error("Please enter a valid URL");
      return;
    }

    try {
      setIsLoading(true);
      
      let linkData: Omit<ReadingItem, 'id'>;
      
      if (metadata) {
        linkData = {
          url: metadata.url,
          title: metadata.title,
          description: metadata.description || null,
          favicon: metadata.favicon || null,
          image: metadata.image || null,
          hostname: metadata.hostname || null,
          isRead: false
        };
      } else {
        try {
          const urlObj = new URL(url);
          linkData = {
            url,
            title: urlObj.hostname,
            description: null,
            favicon: null,
            image: null,
            hostname: urlObj.hostname,
            isRead: false
          };
        } catch {
          linkData = {
            url,
            title: url,
            description: null,
            favicon: null,
            image: null,
            hostname: null,
            isRead: false
          };
        }
      }

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
          <div className="relative">
            <Input
              placeholder="Enter URL (https://...)"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="pr-10 focus-visible:ring-0 focus-visible:ring-offset-0 border-muted/30 focus-visible:border-muted/50 hover:border-muted/50 transition-colors"
              disabled={isLoading}
              autoFocus
            />
            {fetchingMetadata && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </div>

          {metadata && (
            <div className="rounded-lg border border-muted/30 p-3 bg-muted/10">
              <div className="flex gap-3">
                {(metadata.image || metadata.favicon) && (
                  <div className="flex-shrink-0">
                    <img 
                      src={metadata.image || metadata.favicon} 
                      alt=""
                      className="w-12 h-12 rounded object-cover"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        if (img.src === metadata.image && metadata.favicon) {
                          img.src = metadata.favicon;
                        } else {
                          img.style.display = 'none';
                        }
                      }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm line-clamp-2">
                    {metadata.title}
                  </h4>
                  {metadata.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {metadata.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    {metadata.hostname}
                  </p>
                </div>
              </div>
            </div>
          )}
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
