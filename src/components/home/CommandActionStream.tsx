import { useMemo } from "react";
import { motion } from "framer-motion";
import { Inbox } from "lucide-react";
import { CommandActionCard } from "./CommandActionCard";
import { GuidedBanner } from "./GuidedBanner";
import type { TriageQueueItem } from "@/hooks/useTriageQueue";
import type { GuidedOverlay } from "@/hooks/useActionIntelligence";

interface CommandActionStreamProps {
  items: TriageQueueItem[];
  isLoading: boolean;
  onItemClick: (item: TriageQueueItem) => void;
  onTrusted: (workItemId: string) => void;
  onNoAction: (workItemId: string) => void;
  onSnooze: (workItemId: string, until: Date) => void;
  guidedOverlay?: GuidedOverlay | null;
  onClearGuided?: () => void;
}

interface ItemGroup {
  label: string;
  items: TriageQueueItem[];
}

export function CommandActionStream({
  items,
  isLoading,
  onItemClick,
  onTrusted,
  onNoAction,
  onSnooze,
  guidedOverlay,
  onClearGuided,
}: CommandActionStreamProps) {
  const groups = useMemo<ItemGroup[]>(() => {
    const critical: TriageQueueItem[] = [];
    const dueToday: TriageQueueItem[] = [];
    const upcoming: TriageQueueItem[] = [];

    for (const item of items) {
      if (item.priorityScore >= 0.7) critical.push(item);
      else if (item.priorityScore >= 0.4) dueToday.push(item);
      else upcoming.push(item);
    }

    return [
      { label: "Critical", items: critical },
      { label: "Due Today", items: dueToday },
      { label: "Upcoming", items: upcoming },
    ].filter(g => g.items.length > 0);
  }, [items]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-14 rounded-xl bg-muted/20 animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
          <Inbox className="h-6 w-6 text-muted-foreground/50" />
        </div>
        <p className="text-muted-foreground font-light text-lg">All clear</p>
        <p className="text-muted-foreground/60 text-sm mt-1">No items awaiting action</p>
      </motion.div>
    );
  }

  let globalIndex = 0;

  return (
    <div className="max-h-[calc(100vh-12rem)] overflow-y-auto pr-1 space-y-5">
      {guidedOverlay?.active && onClearGuided && (
        <GuidedBanner
          moveLabel={guidedOverlay.moveLabel}
          remainingCount={items.length}
          onDismiss={onClearGuided}
        />
      )}
      {groups.map(group => (
        <div key={group.label}>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
            {group.label}
          </p>
          <div className="space-y-1.5">
            {group.items.map(item => {
              const idx = globalIndex++;
              return (
                <CommandActionCard
                  key={item.id}
                  item={item}
                  index={idx}
                  onClick={() => onItemClick(item)}
                  onTrusted={onTrusted}
                  onNoAction={onNoAction}
                  onSnooze={onSnooze}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
