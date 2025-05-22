
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StatusSelectorProps {
  status: "todo" | "inprogress" | "done";
  onSelectStatus: (status: "todo" | "inprogress" | "done") => void;
}

export function StatusSelector({ status, onSelectStatus }: StatusSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium block">Status</label>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-8 px-3 rounded-full text-sm font-medium",
            status === "todo" 
              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-inner border-transparent" 
              : "bg-white/5 hover:bg-white/15 border border-white/10"
          )}
          onClick={() => onSelectStatus("todo")}
        >
          To Do
        </Button>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-8 px-3 rounded-full text-sm font-medium",
            status === "inprogress" 
              ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-inner border-transparent" 
              : "bg-white/5 hover:bg-white/15 border border-white/10"
          )}
          onClick={() => onSelectStatus("inprogress")}
        >
          In Progress
        </Button>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-8 px-3 rounded-full text-sm font-medium",
            status === "done" 
              ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-inner border-transparent" 
              : "bg-white/5 hover:bg-white/15 border border-white/10"
          )}
          onClick={() => onSelectStatus("done")}
        >
          Done
        </Button>
      </div>
    </div>
  );
}
