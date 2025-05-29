
import { useState } from "react";
import { LinkIcon, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReadingItem } from "@/hooks/useReadingItems";
import { toast } from "sonner";

interface AddLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddLink: (linkData: Omit<ReadingItem, 'id'>) => void;
}

export function AddLinkDialog({ open, onOpenChange, onAddLink }: AddLinkDialogProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setUrl("");
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
      
      // Create new link - in a real app, we might fetch metadata from a backend
      // but here we'll just use the URL directly
      const newLink: Omit<ReadingItem, 'id'> = {
        url,
        title: url,
        description: null,
        favicon: null,
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
              onChange={(e) => setUrl(e.target.value)}
              className="pr-10 focus-visible:ring-0 focus-visible:ring-offset-0 border-gray-300 dark:border-gray-700 focus-visible:border-gray-400 dark:focus-visible:border-gray-500 hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
              disabled={isLoading}
              autoFocus
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin" />
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
            <Button 
              type="submit" 
              disabled={!url || isLoading}
              className="w-full py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition shadow"
            >
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
