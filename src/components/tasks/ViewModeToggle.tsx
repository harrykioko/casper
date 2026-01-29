
import { List, LayoutGrid, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ViewModeToggleProps {
  viewMode: "list" | "kanban";
  onViewModeChange: (mode: "list" | "kanban") => void;
  showInbox?: boolean;
  onShowInboxChange?: (show: boolean) => void;
}

export function ViewModeToggle({ 
  viewMode, 
  onViewModeChange, 
  showInbox = true,
  onShowInboxChange 
}: ViewModeToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant={viewMode === "list" ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewModeChange("list")}
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
        
        <Button
          variant={viewMode === "kanban" ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewModeChange("kanban")}
          className={cn(
            "flex items-center gap-2 rounded-full transition-all",
            viewMode === "kanban" 
              ? "bg-primary text-primary-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <LayoutGrid className="h-4 w-4" />
          Kanban View
        </Button>
      </div>

      {onShowInboxChange && (
        <div className="flex items-center gap-2">
          <Label htmlFor="inbox-toggle" className="flex items-center gap-2 cursor-pointer">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Show Triage</span>
          </Label>
          <Switch
            id="inbox-toggle"
            checked={showInbox}
            onCheckedChange={onShowInboxChange}
          />
        </div>
      )}
    </div>
  );
}
