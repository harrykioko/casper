import { useState } from "react";
import { 
  ListTodo, 
  StickyNote, 
  Building2, 
  Tag, 
  Clock, 
  Check, 
  Archive,
  Sparkles,
  History,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { InboxItem } from "@/types/inbox";

interface InboxActionRailProps {
  item: InboxItem;
  onCreateTask: (item: InboxItem) => void;
  onMarkComplete: (id: string) => void;
  onArchive: (id: string) => void;
  onSnooze?: (id: string, until: Date) => void;
  onAddNote?: (item: InboxItem) => void;
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2">
      {children}
    </h4>
  );
}

function ActionButton({ 
  icon: Icon, 
  label, 
  onClick, 
  variant = "ghost",
  disabled = false 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  label: string; 
  onClick: () => void;
  variant?: "ghost" | "outline" | "default";
  disabled?: boolean;
}) {
  return (
    <Button
      variant={variant}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="w-full justify-start h-8 text-xs font-medium"
    >
      <Icon className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
      {label}
    </Button>
  );
}

export function InboxActionRail({
  item,
  onCreateTask,
  onMarkComplete,
  onArchive,
  onSnooze,
  onAddNote,
}: InboxActionRailProps) {
  const [isActivityOpen, setIsActivityOpen] = useState(false);

  const handleSnooze = (hours: number) => {
    if (!onSnooze) return;
    const until = new Date();
    if (hours === 4) {
      until.setHours(until.getHours() + 4);
    } else if (hours === 24) {
      until.setDate(until.getDate() + 1);
      until.setHours(9, 0, 0, 0);
    } else if (hours === 168) {
      until.setDate(until.getDate() + 7);
      until.setHours(9, 0, 0, 0);
    }
    onSnooze(item.id, until);
  };

  // Placeholder suggestions - will be replaced with actual AI suggestions
  const suggestions: { title: string; confidence: number; effort: string }[] = [];

  // Placeholder activity - will be replaced with actual activity log
  const activityItems: { action: string; timestamp: string }[] = [];

  return (
    <div className="h-full p-4 space-y-5 bg-muted/30">
      {/* Take Action Section */}
      <div>
        <SectionHeader>Take Action</SectionHeader>
        <div className="space-y-1">
          <ActionButton
            icon={ListTodo}
            label="Create Task"
            onClick={() => onCreateTask(item)}
            variant="outline"
          />
          <ActionButton
            icon={StickyNote}
            label="Add Note"
            onClick={() => onAddNote?.(item)}
            disabled={!onAddNote}
          />
          <ActionButton
            icon={Building2}
            label="Link Company"
            onClick={() => {}}
            disabled
          />
          <ActionButton
            icon={Tag}
            label="Set Category"
            onClick={() => {}}
            disabled
          />
          
          {/* Snooze Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-8 text-xs font-medium"
                disabled={!onSnooze}
              >
                <Clock className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                Snooze
                <ChevronDown className="h-3 w-3 ml-auto" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40 bg-popover">
              <DropdownMenuItem onClick={() => handleSnooze(4)}>
                Later today
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSnooze(24)}>
                Tomorrow
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSnooze(168)}>
                Next week
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Divider */}
        <div className="border-t border-border my-3" />

        <div className="space-y-1">
          <ActionButton
            icon={Check}
            label="Complete"
            onClick={() => onMarkComplete(item.id)}
          />
          <ActionButton
            icon={Archive}
            label="Archive"
            onClick={() => onArchive(item.id)}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Suggested Actions Section */}
      <div>
        <SectionHeader>
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            Suggested Actions
            {suggestions.length > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                {suggestions.length}
              </span>
            )}
          </span>
        </SectionHeader>

        {suggestions.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            No suggestions yet
          </p>
        ) : (
          <div className="space-y-2">
            {suggestions.map((suggestion, i) => (
              <div 
                key={i}
                className="p-2 rounded-lg border border-border bg-background/50"
              >
                <p className="text-xs font-medium mb-1">{suggestion.title}</p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className={cn(
                    "px-1.5 py-0.5 rounded",
                    suggestion.confidence >= 0.8 
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                      : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                  )}>
                    {Math.round(suggestion.confidence * 100)}%
                  </span>
                  <span>{suggestion.effort}</span>
                </div>
                <div className="flex gap-1 mt-2">
                  <Button size="sm" variant="outline" className="h-6 text-[10px] flex-1">
                    Approve
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2">
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Activity Section */}
      <Collapsible open={isActivityOpen} onOpenChange={setIsActivityOpen}>
        <CollapsibleTrigger className="w-full">
          <SectionHeader>
            <span className="flex items-center gap-1.5">
              <History className="h-3 w-3" />
              Activity
              {activityItems.length > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {activityItems.length}
                </span>
              )}
              <ChevronDown className={cn(
                "h-3 w-3 ml-auto transition-transform",
                isActivityOpen && "rotate-180"
              )} />
            </span>
          </SectionHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {activityItems.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No activity recorded
            </p>
          ) : (
            <div className="space-y-2">
              {activityItems.map((activity, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-foreground">{activity.action}</p>
                    <p className="text-muted-foreground text-[10px]">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
