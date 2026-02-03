import { useMemo } from "react";
import { Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ReadingItemCard } from "./ReadingItemCard";
import type { ReadingItem } from "@/types/readingItem";

interface ReadingSignalsSectionProps {
  items: ReadingItem[];
  projects: Array<{ id: string; name: string; color?: string | null }>;
  onFavorite: (id: string) => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateProject: (id: string, projectId: string | null) => void;
}

export function ReadingSignalsSection({
  items,
  projects,
  onFavorite,
  onMarkRead,
  onDelete,
  onUpdateProject,
}: ReadingSignalsSectionProps) {
  // Group signals by actionability
  const grouped = useMemo(() => {
    const groups: Record<string, ReadingItem[]> = {
      diligence: [],
      follow_up: [],
      idea: [],
      none: [],
    };

    items.forEach((item) => {
      const key = item.actionability || "none";
      if (groups[key]) {
        groups[key].push(item);
      } else {
        groups.none.push(item);
      }
    });

    return groups;
  }, [items]);

  // Collect all topics across signal items for a topic cloud
  const topicCounts = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((item) => {
      (item.topics || []).forEach((topic) => {
        counts.set(topic, (counts.get(topic) || 0) + 1);
      });
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
  }, [items]);

  if (items.length === 0) return null;

  const ACTIONABILITY_LABELS: Record<string, { label: string; color: string }> = {
    diligence: { label: "Diligence", color: "bg-red-500/20 text-red-400 border-red-500/30" },
    follow_up: { label: "Follow-up", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    idea: { label: "Idea", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    none: { label: "Informational", color: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
  };

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
          <Radio className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <h2 className="text-sm font-semibold text-foreground tracking-tight">Signals</h2>
        <span className="text-xs text-muted-foreground">{items.length}</span>
      </div>

      {/* Topic cloud */}
      {topicCounts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {topicCounts.map(([topic, count]) => (
            <Badge
              key={topic}
              variant="outline"
              className="text-[10px] px-2 py-0.5 bg-purple-500/5 text-purple-300 border-purple-500/20"
            >
              {topic}
              <span className="ml-1 opacity-60">{count}</span>
            </Badge>
          ))}
        </div>
      )}

      {/* Grouped by actionability */}
      {(["diligence", "follow_up", "idea", "none"] as const).map((key) => {
        const group = grouped[key];
        if (!group || group.length === 0) return null;
        const style = ACTIONABILITY_LABELS[key];

        return (
          <div key={key}>
            <div className="flex items-center gap-2 mb-3">
              <Badge
                variant="outline"
                className={`text-[10px] px-2 py-0.5 ${style.color}`}
              >
                {style.label}
              </Badge>
              <span className="text-xs text-muted-foreground">{group.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {group.map((item) => (
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
      })}
    </div>
  );
}
