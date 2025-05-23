
import { MessageSquareText } from "lucide-react";

export function PromptEmptyState() {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <MessageSquareText className="h-12 w-12 mx-auto mb-3 opacity-20" />
      <p className="text-lg font-medium">No prompts found</p>
      <p className="text-sm">Try adjusting your search or filters</p>
    </div>
  );
}
