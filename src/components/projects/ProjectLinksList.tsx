import { useState } from "react";
import { Link2, Trash, ExternalLink, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddResourceDialog } from "./AddResourceDialog";
import { DeleteResourceDialog } from "./DeleteResourceDialog";
import { GlassModuleCard } from "./GlassModuleCard";
import { ProjectEmptyState } from "./ProjectEmptyState";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
      toast.success("Resource added successfully (demo)");
    }
  };
  
  const confirmDeleteResource = () => {
    if (resourceToDelete && onRemoveLink) {
      onRemoveLink(resourceToDelete.id);
      setResourceToDelete(null);
    } else {
      toast.success("Resource deleted successfully (demo)");
      setResourceToDelete(null);
    }
  };
  
  return (
    <>
      <GlassModuleCard
        icon={<BookOpen className="w-4 h-4" />}
        title="Resources"
        count={links.length}
        onAdd={() => setIsAddResourceOpen(true)}
        addLabel="Add Resource"
        accentColor="#f59e0b"
      >
        {links.length === 0 ? (
          <ProjectEmptyState
            icon={<BookOpen className="w-7 h-7" />}
            title="No resources yet"
            description="Save links and references for your project."
            actionLabel="Add Resource"
            onAction={() => setIsAddResourceOpen(true)}
          />
        ) : (
          <ul className="space-y-1.5">
            {links.map(link => (
              <li key={link.id} className="group/link">
                <div className={cn(
                  "flex items-center justify-between gap-2 p-2.5 rounded-xl transition-all duration-200",
                  "bg-white/30 dark:bg-white/[0.03]",
                  "border border-white/20 dark:border-white/[0.06]",
                  "hover:bg-white/50 dark:hover:bg-white/[0.06]",
                  "hover:translate-y-[-1px] hover:shadow-sm"
                )}>
                  <a 
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 flex-1 text-sm text-foreground/90 hover:text-primary transition-colors"
                  >
                    <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{link.title}</span>
                    <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover/link:opacity-50 transition-opacity" />
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover/link:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setResourceToDelete(link)}
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </GlassModuleCard>
      
      <AddResourceDialog 
        open={isAddResourceOpen} 
        onOpenChange={setIsAddResourceOpen}
        onAddResource={handleAddResource}
      />
      
      <DeleteResourceDialog
        open={!!resourceToDelete}
        onOpenChange={(isOpen) => !isOpen && setResourceToDelete(null)}
        onConfirm={confirmDeleteResource}
        resourceTitle={resourceToDelete?.title || ""}
      />
    </>
  );
}
