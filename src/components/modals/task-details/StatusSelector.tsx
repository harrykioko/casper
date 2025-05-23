
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface StatusSelectorProps {
  status: "todo" | "inprogress" | "done";
  onSelectStatus: (status: "todo" | "inprogress" | "done") => void;
}

export function StatusSelector({ status, onSelectStatus }: StatusSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs uppercase text-white/50 tracking-wide block">Status</label>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-8 px-3 py-1 rounded-full text-sm font-medium",
            status === "todo" 
              ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-inner border-transparent" 
              : "bg-white/5 hover:bg-white/10 border border-white/10"
          )}
          onClick={() => onSelectStatus("todo")}
        >
          To Do
        </Button>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-8 px-3 py-1 rounded-full text-sm font-medium",
            status === "inprogress" 
              ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-inner border-transparent" 
              : "bg-white/5 hover:bg-white/10 border border-white/10"
          )}
          onClick={() => onSelectStatus("inprogress")}
        >
          In Progress
        </Button>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-8 px-3 py-1 rounded-full text-sm font-medium",
            status === "done" 
              ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-inner border-transparent" 
              : "bg-white/5 hover:bg-white/10 border border-white/10"
          )}
          onClick={() => onSelectStatus("done")}
        >
          Done
        </Button>
      </div>
    </div>
  );
}
