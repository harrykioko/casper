import { ArrowUpRight } from "lucide-react";
import { ReadingItemCard } from "./ReadingItemCard";
import type { ReadingItem } from "@/types/readingItem";

interface ReadingUpNextSectionProps {
  items: ReadingItem[];
  projects: Array<{ id: string; name: string; color?: string | null }>;
  onFavorite: (id: string) => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateProject: (id: string, projectId: string | null) => void;
}

export function ReadingUpNextSection({
  items,
  projects,
  onFavorite,
  onMarkRead,
  onDelete,
  onUpdateProject,
}: ReadingUpNextSectionProps) {
  if (items.length === 0) return null;

  return (
    <div className="mb-8">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
          <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <h2 className="text-sm font-semibold text-foreground tracking-tight">Up Next</h2>
        <span className="text-xs text-muted-foreground">{items.length}</span>
      </div>

      {/* Spotlight shelf with subtle gradient background */}
      <div className="relative rounded-2xl bg-gradient-to-r from-primary/[0.03] via-primary/[0.06] to-primary/[0.03] border border-primary/10 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((item) => (
            <ReadingItemCard
              key={item.id}
              item={item}
              projects={projects}
              variant="spotlight"
              onFavorite={onFavorite}
              onMarkRead={onMarkRead}
              onDelete={onDelete}
              onUpdateProject={onUpdateProject}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
