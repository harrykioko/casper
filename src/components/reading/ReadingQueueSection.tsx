import { ListPlus } from "lucide-react";
import { ReadingItemCard } from "./ReadingItemCard";
import type { ReadingItem } from "@/types/readingItem";

interface ReadingQueueSectionProps {
  items: ReadingItem[];
  projects: Array<{ id: string; name: string; color?: string | null }>;
  onFavorite: (id: string) => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateProject: (id: string, projectId: string | null) => void;
}

export function ReadingQueueSection({
  items,
  projects,
  onFavorite,
  onMarkRead,
  onDelete,
  onUpdateProject,
}: ReadingQueueSectionProps) {
  if (items.length === 0) return null;

  return (
    <div className="mb-8">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-slate-500/20 flex items-center justify-center">
          <ListPlus className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <h2 className="text-sm font-semibold text-foreground tracking-tight">Queue</h2>
        <span className="text-xs text-muted-foreground">{items.length}</span>
      </div>

      {/* Standard grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((item) => (
          <ReadingItemCard
            key={item.id}
            item={item}
            projects={projects}
            variant="default"
            onFavorite={onFavorite}
            onMarkRead={onMarkRead}
            onDelete={onDelete}
            onUpdateProject={onUpdateProject}
          />
        ))}
      </div>
    </div>
  );
}
