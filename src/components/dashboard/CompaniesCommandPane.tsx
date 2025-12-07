import { Building2 } from "lucide-react";
import { GlassPanel, GlassPanelHeader } from "@/components/ui/glass-panel";

interface CompaniesCommandPaneProps {
  onCompanyClick?: (id: string, type: 'portfolio' | 'pipeline') => void;
}

export function CompaniesCommandPane({ onCompanyClick }: CompaniesCommandPaneProps) {
  return (
    <GlassPanel className="h-full min-h-[400px]">
      <GlassPanelHeader 
        title="Companies"
        action={
          <span className="text-xs text-muted-foreground">
            At a glance: what needs your attention
          </span>
        }
      />
      
      {/* Placeholder for filter chips */}
      <div className="flex gap-2 mb-4 px-1">
        <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">All</span>
        <span className="text-xs px-3 py-1 rounded-full bg-muted/50 text-muted-foreground hover:bg-muted/70 cursor-pointer transition-colors">Portfolio</span>
        <span className="text-xs px-3 py-1 rounded-full bg-muted/50 text-muted-foreground hover:bg-muted/70 cursor-pointer transition-colors">Pipeline</span>
      </div>
      
      {/* Placeholder body */}
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <div className="text-center">
          <Building2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm font-medium mb-1">Companies attention grid coming soon</p>
          <p className="text-xs text-muted-foreground/70">
            Your portfolio and pipeline companies will appear here
          </p>
        </div>
      </div>
    </GlassPanel>
  );
}
