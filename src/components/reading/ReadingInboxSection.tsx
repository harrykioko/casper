import { useState, useMemo } from "react";
import { Inbox, CheckSquare, ListPlus, Archive, Square, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReadingItemCard } from "./ReadingItemCard";
import { cn } from "@/lib/utils";
import type { ReadingItem } from "@/types/readingItem";

interface ReadingInboxSectionProps {
  items: ReadingItem[];
  projects: Array<{ id: string; name: string; color?: string | null }>;
  onFavorite: (id: string) => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateProject: (id: string, projectId: string | null) => void;
  onBatchAction: (ids: string[], action: "queue" | "archive") => void;
}

export function ReadingInboxSection({
  items,
  projects,
  onFavorite,
  onMarkRead,
  onDelete,
  onUpdateProject,
  onBatchAction,
}: ReadingInboxSectionProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const isSelecting = selectedIds.size > 0;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(items.map((i) => i.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBatch = (action: "queue" | "archive") => {
    onBatchAction([...selectedIds], action);
    clearSelection();
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Inbox className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p className="text-lg font-medium">Inbox zero</p>
        <p className="text-sm">All reading items have been triaged</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section header with batch controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Inbox className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <h2 className="text-sm font-semibold text-foreground tracking-tight">Inbox</h2>
          <Badge variant="secondary" className="text-[10px] bg-amber-500/20 text-amber-400">
            {items.length}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5">
          {isSelecting ? (
            <>
              <span className="text-xs text-muted-foreground mr-1">
                {selectedIds.size} selected
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[10px] gap-1 px-2"
                onClick={() => handleBatch("queue")}
              >
                <ListPlus className="w-3 h-3" />
                Queue
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[10px] gap-1 px-2"
                onClick={() => handleBatch("archive")}
              >
                <Archive className="w-3 h-3" />
                Archive
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-[10px] px-2"
                onClick={clearSelection}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-[10px] gap-1 px-2 text-muted-foreground"
                onClick={selectAll}
              >
                <CheckCheck className="w-3 h-3" />
                Select All
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Items grid with selection overlay */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.id} className="relative">
            {/* Selection checkbox overlay */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSelect(item.id);
              }}
              className={cn(
                "absolute top-2 left-2 z-10 w-5 h-5 rounded flex items-center justify-center transition-all",
                selectedIds.has(item.id)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/80 text-muted-foreground opacity-0 group-hover:opacity-100 hover:opacity-100",
                isSelecting && "opacity-100"
              )}
            >
              {selectedIds.has(item.id) ? (
                <CheckSquare className="w-3.5 h-3.5" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
            </button>

            <div className={cn(
              "transition-all",
              selectedIds.has(item.id) && "ring-2 ring-primary/40 rounded-xl"
            )}>
              <ReadingItemCard
                item={item}
                projects={projects}
                variant="default"
                onFavorite={onFavorite}
                onMarkRead={onMarkRead}
                onDelete={onDelete}
                onUpdateProject={onUpdateProject}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
