
import { useState } from "react";
import { LinkIcon, Loader2, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReadingItem, fetchLinkMetadata } from "@/hooks/useReadingItems";
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

    // Only fetch metadata if it looks like a valid URL
    if (value && (value.startsWith('http://') || value.startsWith('https://'))) {
      try {
        setFetchingMetadata(true);
        const fetchedMetadata = await fetchLinkMetadata(value);
        setMetadata(fetchedMetadata);
      } catch (error) {
        console.error("Error fetching metadata:", error);
        // Continue without metadata
      } finally {
        setFetchingMetadata(false);
      }
    }
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
      
      let linkData: Omit<ReadingItem, 'id'>;
      
      if (metadata) {
        // Use fetched metadata
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
        // Fallback to basic URL data
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl bg-white/10 dark:bg-zinc-900/30 backdrop-blur-sm ring-1 ring-white/10 dark:ring-white/5 shadow-2xl transition-all">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" /> Add to Reading List
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              placeholder="Enter URL (https://...)"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="pr-10 focus-visible:ring-0 focus-visible:ring-offset-0 border-gray-300 dark:border-gray-700 focus-visible:border-gray-400 dark:focus-visible:border-gray-500 hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
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
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white/5 dark:bg-gray-800/20 backdrop-blur-sm">
              <div className="flex gap-3">
                {(metadata.image || metadata.favicon) && (
                  <div className="flex-shrink-0">
                    <img 
                      src={metadata.image || metadata.favicon} 
                      alt=""
                      className="w-12 h-12 rounded object-cover"
                      onError={(e) => {
                        // If image fails, try favicon, if favicon fails, hide
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
                  <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
                    {metadata.title}
                  </h4>
                  {metadata.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                      {metadata.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    {metadata.hostname}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="sm:justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!url || isLoading}
              className="w-full py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition shadow"
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
