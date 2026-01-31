import { useMemo } from 'react';
import { BookOpen, Clock, Plus, Star, CheckCircle, Archive, Radio, Inbox, Folder, ExternalLink, Check, ListTodo, ArrowUpRight, ListPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ReadingItem } from '@/types/readingItem';
import {
  ReadingFilter,
  ReadingPrimaryView,
  getReadingCounts,
  getSuggestedReading,
  getEstimatedReadingTime,
  getAddedThisWeekCount
} from './readingHelpers';

interface ReadingCommandPanelProps {
  items: ReadingItem[];
  filter: ReadingFilter;
  onFilterChange: (filter: ReadingFilter) => void;
  onSuggestedClick: (itemId: string) => void;
  onQuickAction: (itemId: string, action: 'open' | 'markRead' | 'flag' | 'archive' | 'task') => void;
  availableProjects: { id: string; name: string }[];
}

interface StatChipProps {
  label: string;
  count: number;
  icon: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'rose';
  attention?: boolean;
}

function StatChip({ label, count, icon, isActive, onClick, variant = 'default', attention }: StatChipProps) {
  const colors = variant === 'rose'
    ? {
        active: 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30',
        inactive: 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-500/10'
      }
    : {
        active: 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600',
        inactive: 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50'
      };

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
        isActive ? colors.active : colors.inactive
      )}
    >
      {icon}
      <span>{label}</span>
      <Badge
        variant="secondary"
        className={cn(
          "h-5 min-w-[20px] px-1.5 text-[10px]",
          attention && count > 0 && "bg-amber-500/20 text-amber-400"
        )}
      >
        {count}
      </Badge>
    </button>
  );
}

interface SuggestedItemRowProps {
  item: ReadingItem;
  reason: string;
  onOpen: () => void;
  onMarkRead: () => void;
  onFlag: () => void;
  onTask: () => void;
}

function SuggestedItemRow({ item, reason, onOpen, onMarkRead, onFlag, onTask }: SuggestedItemRowProps) {
  return (
    <div className="p-3 rounded-lg bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 space-y-2">
      <div className="flex items-start gap-2">
        {item.favicon && (
          <img
            src={item.favicon}
            alt=""
            className="w-4 h-4 rounded flex-shrink-0 mt-0.5"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight">
            {item.title}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            {item.hostname}
          </p>
        </div>
        {item.isFlagged && (
          <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />
        )}
      </div>

      <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
        {reason}
      </p>

      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
              onClick={(e) => { e.stopPropagation(); onOpen(); }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Open</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400"
              onClick={(e) => { e.stopPropagation(); onMarkRead(); }}
            >
              <Check className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Mark as read</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "h-6 w-6 p-0",
                item.isFlagged
                  ? "text-amber-500 dark:text-amber-400"
                  : "text-slate-600 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400"
              )}
              onClick={(e) => { e.stopPropagation(); onFlag(); }}
            >
              <Star className={cn("w-3.5 h-3.5", item.isFlagged && "fill-current")} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">{item.isFlagged ? 'Remove favorite' : 'Add to favorites'}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
              onClick={(e) => { e.stopPropagation(); onTask(); }}
            >
              <ListTodo className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Create task</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

export function ReadingCommandPanel({
  items,
  filter,
  onFilterChange,
  onSuggestedClick,
  onQuickAction,
  availableProjects,
}: ReadingCommandPanelProps) {
  const counts = useMemo(() => getReadingCounts(items), [items]);
  const suggested = useMemo(() => getSuggestedReading(items, 3), [items]);
  const estimatedTime = useMemo(() => getEstimatedReadingTime(items), [items]);
  const addedThisWeek = useMemo(() => getAddedThisWeekCount(items), [items]);

  const handleViewChange = (view: ReadingPrimaryView) => {
    onFilterChange({ ...filter, primaryView: view });
  };

  const toggleProject = (projectId: string) => {
    const newProjects = filter.projects.includes(projectId)
      ? filter.projects.filter(p => p !== projectId)
      : [...filter.projects, projectId];
    onFilterChange({ ...filter, projects: newProjects });
  };

  const projectsWithReadingItems = useMemo(() => {
    const projectIds = new Set(items.filter(i => i.project_id).map(i => i.project_id!));
    return availableProjects.filter(p => projectIds.has(p.id));
  }, [items, availableProjects]);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h3 className="font-semibold text-sm tracking-tight">Reading Library</h3>
            <p className="text-[10px] text-muted-foreground">Curated reading queue</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Stats</p>
        <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            {counts.upNext} up next
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <ListPlus className="w-3 h-3" />
            {counts.queue} queued
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {estimatedTime}
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Plus className="w-3 h-3" />
            {addedThisWeek} this week
          </span>
        </div>
      </div>

      {/* Primary View Filters */}
      <div className="space-y-2">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Views</p>
        <div className="flex flex-wrap gap-1.5">
          <StatChip
            label="Library"
            count={counts.upNext + counts.queue}
            icon={<BookOpen className="w-3 h-3" />}
            isActive={filter.primaryView === 'library'}
            onClick={() => handleViewChange('library')}
            variant="rose"
          />
          <StatChip
            label="Inbox"
            count={counts.inbox}
            icon={<Inbox className="w-3 h-3" />}
            isActive={filter.primaryView === 'inbox'}
            onClick={() => handleViewChange('inbox')}
            variant="rose"
            attention={true}
          />
          <StatChip
            label="Signals"
            count={counts.signals}
            icon={<Radio className="w-3 h-3" />}
            isActive={filter.primaryView === 'signals'}
            onClick={() => handleViewChange('signals')}
            variant="rose"
          />
          <StatChip
            label="Read"
            count={counts.read}
            icon={<CheckCircle className="w-3 h-3" />}
            isActive={filter.primaryView === 'read'}
            onClick={() => handleViewChange('read')}
            variant="rose"
          />
          <StatChip
            label="Archived"
            count={counts.archived}
            icon={<Archive className="w-3 h-3" />}
            isActive={filter.primaryView === 'archived'}
            onClick={() => handleViewChange('archived')}
            variant="rose"
          />
        </div>
      </div>

      {/* Project Filters */}
      {projectsWithReadingItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">By Project</p>
          <div className="flex flex-wrap gap-1.5">
            {projectsWithReadingItems.map(project => (
              <button
                key={project.id}
                onClick={() => toggleProject(project.id)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                  filter.projects.includes(project.id)
                    ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30'
                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-500/10'
                )}
              >
                <Folder className="w-3 h-3" />
                {project.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Queue */}
      {suggested.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Suggested</p>
          <div className="space-y-2">
            {suggested.map(({ item, reason }) => (
              <SuggestedItemRow
                key={item.id}
                item={item}
                reason={reason}
                onOpen={() => onQuickAction(item.id, 'open')}
                onMarkRead={() => onQuickAction(item.id, 'markRead')}
                onFlag={() => onQuickAction(item.id, 'flag')}
                onTask={() => onQuickAction(item.id, 'task')}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
