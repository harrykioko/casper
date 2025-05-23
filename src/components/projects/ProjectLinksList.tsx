
import { useState } from "react";
import { Link2, Plus, Trash } from "lucide-react";
import { CardTitle, Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddResourceDialog } from "./AddResourceDialog";
import { DeleteResourceDialog } from "./DeleteResourceDialog";
import { toast } from "sonner";

interface Link {
  id: string;
  title: string;
  url: string;
}

interface ProjectLinksListProps {
  links: Link[];
  onAddLink?: (link: { title: string; url: string }) => void;
  onRemoveLink?: (id: string) => void;
}

export function ProjectLinksList({ links, onAddLink, onRemoveLink }: ProjectLinksListProps) {
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<Link | null>(null);
  
  const handleAddResource = (resource: { title: string; url: string }) => {
    if (onAddLink) {
      onAddLink(resource);
    } else {
      // For demo, show a toast
      toast.success("Resource added successfully (demo)");
    }
  };
  
  const confirmDeleteResource = () => {
    if (resourceToDelete && onRemoveLink) {
      onRemoveLink(resourceToDelete.id);
      setResourceToDelete(null);
    } else {
      // For demo, show a toast
      toast.success("Resource deleted successfully (demo)");
      setResourceToDelete(null);
    }
  };
  
  return (
    <>
      <Card className="relative rounded-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-sm ring-1 ring-black/5 dark:ring-white/10 hover:shadow-md/10 transition hover:translate-y-[-2px] group">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Link2 className="mr-2 h-5 w-5" />
            Resources
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition">
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1 text-xs"
                onClick={() => setIsAddResourceOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Resource
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No links yet</p>
          ) : (
            <ul className="space-y-2">
              {links.map(link => (
                <li key={link.id} className="group/link">
                  <div className="flex items-center justify-between gap-2 p-3 rounded-md hover:bg-accent/30 transition-colors">
                    <a 
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 flex-1 text-sm group-hover/link:underline"
                    >
                      <Link2 className="h-3.5 w-3.5 shrink-0" />
                      <span>{link.title}</span>
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover/link:opacity-100 transition-opacity"
                      onClick={() => setResourceToDelete(link)}
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      
      {/* Add Resource Dialog */}
      <AddResourceDialog 
        open={isAddResourceOpen} 
        onOpenChange={setIsAddResourceOpen}
        onAddResource={handleAddResource}
      />
      
      {/* Delete Resource Dialog */}
      <DeleteResourceDialog
        open={!!resourceToDelete}
        onOpenChange={(isOpen) => !isOpen && setResourceToDelete(null)}
        onConfirm={confirmDeleteResource}
        resourceTitle={resourceToDelete?.title || ""}
      />
    </>
  );
}
