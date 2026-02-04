import { Building2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SuggestedLinkCardProps {
  companyId: string;
  companyName: string;
  companyType: "pipeline" | "portfolio";
  confidence: "high" | "medium" | "low";
  rationale?: string;
  onAccept: () => void;
  onReject: () => void;
}

export function SuggestedLinkCard({
  companyName,
  companyType,
  confidence,
  rationale,
  onAccept,
  onReject,
}: SuggestedLinkCardProps) {
  return (
    <TooltipProvider>
      <div className="rounded-md border border-border bg-card p-2.5 space-y-1.5">
        {/* Header row: icon, name, badges */}
        <div className="flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-xs font-medium text-foreground truncate flex-1">
            {companyName}
          </span>
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] h-4 px-1.5 capitalize",
              companyType === "pipeline"
                ? "border-primary/30 text-primary"
                : "border-muted-foreground/30 text-muted-foreground"
            )}
          >
            {companyType}
          </Badge>
          <Badge
            variant="outline"
            className="text-[9px] h-4 px-1.5 border-primary/30 text-primary"
          >
            {confidence}
          </Badge>
        </div>

        {/* Rationale row */}
        {rationale && (
          <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2 pl-5.5">
            {rationale}
          </p>
        )}

        {/* Action buttons row */}
        <div className="flex items-center justify-end gap-1 pt-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                onClick={onReject}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Dismiss suggestion
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-primary/10 hover:text-primary"
                onClick={onAccept}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Link to {companyName}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
