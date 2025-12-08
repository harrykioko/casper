import { CheckCircle2, FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PriorityEmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
}

export function PriorityEmptyState({ hasFilters, onClearFilters }: PriorityEmptyStateProps) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <FilterX className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No matching items</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
          No priority items match your current filters. Try adjusting your search or filter criteria.
        </p>
        <Button variant="outline" onClick={onClearFilters}>
          Clear all filters
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">All caught up!</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        You have no priority items requiring attention right now. Great job staying on top of things!
      </p>
    </div>
  );
}
