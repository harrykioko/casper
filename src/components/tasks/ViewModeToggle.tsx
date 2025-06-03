
import { List, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ViewModeToggleProps {
  viewMode: "list" | "kanban";
  onViewModeChange: (mode: "list" | "kanban") => void;
}

export function ViewModeToggle({ viewMode, onViewModeChange }: ViewModeToggleProps) {
  const handleViewModeChange = (mode: "list" | "kanban") => {
    if (mode === "kanban") {
      // Don't actually change the view, just show tooltip
      return;
    }
    onViewModeChange(mode);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={viewMode === "list" ? "default" : "ghost"}
        size="sm"
        onClick={() => handleViewModeChange("list")}
        className={cn(
          "flex items-center gap-2 rounded-full transition-all",
          viewMode === "list" 
            ? "bg-primary text-primary-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <List className="h-4 w-4" />
        List View
      </Button>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewModeChange("kanban")}
            className="flex items-center gap-2 rounded-full transition-all text-muted-foreground hover:text-foreground"
          >
            <LayoutGrid className="h-4 w-4" />
            Kanban View
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Coming Soon</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
