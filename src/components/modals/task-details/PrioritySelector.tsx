
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PrioritySelectorProps {
  priority: "low" | "medium" | "high" | undefined;
  onSelectPriority: (priority: "low" | "medium" | "high" | undefined) => void;
}

export function PrioritySelector({ priority, onSelectPriority }: PrioritySelectorProps) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-muted-foreground mb-1 block">Priority</label>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className={cn(
            "text-sm px-3 py-1 rounded-full border-muted/40 bg-muted/20",
            priority === "low" 
              ? "bg-muted/40 text-foreground border-muted/60" 
              : "text-muted-foreground hover:bg-muted/30"
          )}
          onClick={() => onSelectPriority(priority === "low" ? undefined : "low")}
        >
          Low
        </Button>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "text-sm px-3 py-1 rounded-full border-muted/40 bg-muted/20",
            priority === "medium" 
              ? "bg-muted/40 text-foreground border-muted/60" 
              : "text-muted-foreground hover:bg-muted/30"
          )}
          onClick={() => onSelectPriority(priority === "medium" ? undefined : "medium")}
        >
          Medium
        </Button>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "text-sm px-3 py-1 rounded-full border-muted/40 bg-muted/20",
            priority === "high" 
              ? "bg-muted/40 text-foreground border-muted/60" 
              : "text-muted-foreground hover:bg-muted/30"
          )}
          onClick={() => onSelectPriority(priority === "high" ? undefined : "high")}
        >
          High
        </Button>
      </div>
    </div>
  );
}
