import { useState } from "react";
import { 
  Inbox, 
  AlertCircle, 
  Clock, 
  Archive, 
  Sparkles,
  ListTodo,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { InboxItem, InboxViewFilter } from "@/types/inbox";
import { 
  getProposedInboxActions, 
  getInboxCounts, 
  getLowPriorityItems,
  type ProposedAction 
} from "./inboxHelpers";

interface InboxSummaryPanelProps {
  items: InboxItem[];
  archivedItems: InboxItem[];
  activeFilter: InboxViewFilter;
  onFilterChange: (filter: InboxViewFilter) => void;
  onItemClick: (item: InboxItem) => void;
  onCreateTaskFromItem: (item: InboxItem) => void;
  onBulkArchive: (ids: string[]) => void;
}

interface StatChipProps {
  label: string;
  count: number;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  colorClass: string;
}

function StatChip({ label, count, icon, isActive, onClick, colorClass }: StatChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all w-full",
        "border",
        isActive
          ? `${colorClass} border-current`
          : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
      )}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      <span className={cn(
        "min-w-[20px] h-5 px-1.5 rounded-full text-xs flex items-center justify-center",
        isActive ? "bg-white/20" : "bg-muted-foreground/10"
      )}>
        {count}
      </span>
    </button>
  );
}

function ProposedActionRow({ 
  action, 
  onOpen, 
  onCreateTask 
}: { 
  action: ProposedAction;
  onOpen: () => void;
  onCreateTask: () => void;
}) {
  return (
    <div className="p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400">
            {action.item.senderName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {action.item.senderName}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {action.item.subject}
          </p>
          <p className="text-[11px] text-sky-600 dark:text-sky-400 mt-0.5">
            {action.reason}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-2">
        <Button 
          size="sm" 
          variant="ghost"
          onClick={onOpen}
          className="h-6 text-[11px] flex-1 px-2"
        >
          Open
          <ChevronRight className="h-3 w-3 ml-0.5" />
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={onCreateTask}
          className="h-6 text-[11px] px-2"
        >
          <ListTodo className="h-3 w-3 mr-1" />
          Task
        </Button>
      </div>
    </div>
  );
}

export function InboxSummaryPanel({
  items,
  archivedItems,
  activeFilter,
  onFilterChange,
  onItemClick,
  onCreateTaskFromItem,
  onBulkArchive,
}: InboxSummaryPanelProps) {
  const [showArchived, setShowArchived] = useState(activeFilter === 'archived');
  
  const counts = getInboxCounts(items, archivedItems);
  const proposedActions = getProposedInboxActions(items, 4);
  const lowPriorityItems = getLowPriorityItems(items);

  const handleShowArchivedToggle = (checked: boolean) => {
    setShowArchived(checked);
    onFilterChange(checked ? 'archived' : 'all');
  };

  const handleBulkArchive = () => {
    const ids = lowPriorityItems.map(i => i.id);
    if (ids.length > 0) {
      onBulkArchive(ids);
    }
  };

  return (
    <div className="sticky top-24 space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Inbox Command</h2>
            <p className="text-xs text-muted-foreground">What needs your attention</p>
          </div>
        </div>

        {/* Stat Chips */}
        <div className="space-y-2 mb-5">
          <StatChip
            label="Unread"
            count={counts.unread}
            icon={<Inbox className="h-4 w-4" />}
            isActive={activeFilter === 'all' && !showArchived}
            onClick={() => {
              setShowArchived(false);
              onFilterChange('all');
            }}
            colorClass="bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
          />
          <StatChip
            label="Action Required"
            count={counts.actionRequired}
            icon={<AlertCircle className="h-4 w-4" />}
            isActive={activeFilter === 'action'}
            onClick={() => {
              setShowArchived(false);
              onFilterChange('action');
            }}
            colorClass="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          />
          <StatChip
            label="Waiting On"
            count={counts.waitingOn}
            icon={<Clock className="h-4 w-4" />}
            isActive={activeFilter === 'waiting'}
            onClick={() => {
              setShowArchived(false);
              onFilterChange('waiting');
            }}
            colorClass="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
          />
          <StatChip
            label="Archived"
            count={counts.archived}
            icon={<Archive className="h-4 w-4" />}
            isActive={activeFilter === 'archived'}
            onClick={() => {
              setShowArchived(true);
              onFilterChange('archived');
            }}
            colorClass="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
          />
        </div>

        {/* Proposed Actions */}
        {proposedActions.length > 0 && !showArchived && (
          <div className="mb-4">
            <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Suggested Actions
            </h3>
            <div className="space-y-1.5">
              {proposedActions.map((action) => (
                <ProposedActionRow
                  key={action.item.id}
                  action={action}
                  onOpen={() => onItemClick(action.item)}
                  onCreateTask={() => onCreateTaskFromItem(action.item)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Quick Controls */}
        <div className="pt-4 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Show archived</span>
            <Switch
              checked={showArchived}
              onCheckedChange={handleShowArchivedToggle}
            />
          </div>
          
          {lowPriorityItems.length > 0 && !showArchived && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={handleBulkArchive}
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive {lowPriorityItems.length} low-priority
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
