import { Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InboxEmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
}

export function InboxEmptyState({ hasFilters, onClearFilters }: InboxEmptyStateProps) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center mb-4">
          <Mail className="w-8 h-8 text-sky-500" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">
          No messages match your filters
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Try adjusting your search or filter criteria.
        </p>
        <Button variant="outline" onClick={onClearFilters}>
          Clear all filters
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center mb-4">
        <Sparkles className="w-8 h-8 text-sky-500" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-1">
        Inbox zero!
      </h3>
      <p className="text-sm text-muted-foreground">
        You're all caught up. No messages to review.
      </p>
    </div>
  );
}
