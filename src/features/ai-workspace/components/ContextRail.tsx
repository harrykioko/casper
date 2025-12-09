/**
 * AI Workspace Context Rail - v1 Scaffolding
 * Left column showing context items (emails, tasks, companies).
 */

import { Mail, CheckSquare, Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AIWorkspaceContextItem } from "../types";

interface ContextRailProps {
  contextItems: AIWorkspaceContextItem[];
  onAddContext?: () => void;
}

const typeConfig = {
  email: { icon: Mail, label: "Email", color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-100 dark:bg-sky-900/30" },
  task: { icon: CheckSquare, label: "Task", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  company: { icon: Building2, label: "Company", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-900/30" },
};

function ContextCard({ item, isPrimary }: { item: AIWorkspaceContextItem; isPrimary?: boolean }) {
  const config = typeConfig[item.type];
  const Icon = config.icon;

  return (
    <div className={cn(
      "rounded-xl p-3 transition-all",
      "bg-white/50 dark:bg-white/[0.04]",
      "border border-white/30 dark:border-white/[0.06]",
      "hover:bg-white/70 dark:hover:bg-white/[0.08]",
      isPrimary && "p-4"
    )}>
      <div className="flex items-start gap-3">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", config.bg)}>
          <Icon className={cn("h-4 w-4", config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={cn("text-[10px] font-medium uppercase tracking-wider", config.color)}>
              {config.label}
            </span>
          </div>
          <h4 className="text-sm font-medium text-foreground truncate">{item.title}</h4>
          {item.subtitle && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{item.subtitle}</p>
          )}
          {isPrimary && item.preview && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-4 leading-relaxed">
              {item.preview}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function ContextRail({ contextItems, onAddContext }: ContextRailProps) {
  const [primaryItem, ...otherItems] = contextItems;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10">
        <h3 className="text-sm font-semibold text-foreground">Context</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {contextItems.length} item{contextItems.length !== 1 ? "s" : ""} loaded
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* Primary context card */}
        {primaryItem && (
          <ContextCard item={primaryItem} isPrimary />
        )}

        {/* Other context items */}
        {otherItems.length > 0 && (
          <div className="space-y-2 mt-3">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-1">
              Related
            </p>
            {otherItems.map(item => (
              <ContextCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/10">
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddContext}
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add context
        </Button>
        <p className="text-[10px] text-muted-foreground mt-2 px-2">
          Coming soon: add tasks, links, or notes as context
        </p>
      </div>
    </div>
  );
}
