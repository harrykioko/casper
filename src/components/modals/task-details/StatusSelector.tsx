
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StatusSelectorProps {
  status: "todo" | "inprogress" | "done";
  onSelectStatus: (status: "todo" | "inprogress" | "done") => void;
}

export function StatusSelector({ status, onSelectStatus }: StatusSelectorProps) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-muted-foreground mb-1 block">Status</label>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className={cn(
            "text-sm px-3 py-1 rounded-full border-muted/40 bg-muted/20",
            status === "todo" 
              ? "bg-muted/40 text-foreground border-muted/60" 
              : "text-muted-foreground hover:bg-muted/30"
          )}
          onClick={() => onSelectStatus("todo")}
        >
          To Do
        </Button>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "text-sm px-3 py-1 rounded-full border-muted/40 bg-muted/20",
            status === "inprogress" 
              ? "bg-muted/40 text-foreground border-muted/60" 
              : "text-muted-foreground hover:bg-muted/30"
          )}
          onClick={() => onSelectStatus("inprogress")}
        >
          In Progress
        </Button>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "text-sm px-3 py-1 rounded-full border-muted/40 bg-muted/20",
            status === "done" 
              ? "bg-muted/40 text-foreground border-muted/60" 
              : "text-muted-foreground hover:bg-muted/30"
          )}
          onClick={() => onSelectStatus("done")}
        >
          Done
        </Button>
      </div>
    </div>
  );
}
