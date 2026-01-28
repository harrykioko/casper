import { Folder, FileText, CheckSquare, BookOpen, Sparkles, Link, Pin, PinOff, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PROJECT_TYPES, PROJECT_STATUSES, ProjectType, ProjectStatus } from '@/lib/constants/projectTypes';
import { formatDistanceToNow } from 'date-fns';

interface ProjectStats {
  notesCount: number;
  tasksCount: number;
  completedTasksCount: number;
  readingItemsCount: number;
  promptsCount: number;
  assetsCount: number;
}

interface ProjectCommandPanelProps {
  projectName: string;
  projectColor?: string | null;
  projectType: ProjectType;
  projectStatus: ProjectStatus;
  isPinned: boolean;
  stats: ProjectStats;
  activeSection: string;
  onSectionChange: (section: string) => void;
  onTogglePin: () => void;
  onStatusChange: (status: ProjectStatus) => void;
  lastUpdated?: string;
}

const SECTIONS = [
  { id: 'all', label: 'All', icon: Folder },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'reading', label: 'Reading', icon: BookOpen },
  { id: 'prompts', label: 'Prompts', icon: Sparkles },
  { id: 'assets', label: 'Assets', icon: Link },
];

export function ProjectCommandPanel({
  projectName,
  projectColor,
  projectType,
  projectStatus,
  isPinned,
  stats,
  activeSection,
  onSectionChange,
  onTogglePin,
  onStatusChange,
  lastUpdated,
}: ProjectCommandPanelProps) {
  const typeConfig = PROJECT_TYPES[projectType] || PROJECT_TYPES.other;
  const statusConfig = PROJECT_STATUSES[projectStatus] || PROJECT_STATUSES.active;
  const TypeIcon = typeConfig.icon;

  const getSectionCount = (sectionId: string) => {
    switch (sectionId) {
      case 'notes': return stats.notesCount;
      case 'tasks': return stats.tasksCount;
      case 'reading': return stats.readingItemsCount;
      case 'prompts': return stats.promptsCount;
      case 'assets': return stats.assetsCount;
      default: return null;
    }
  };

  return (
    <div className={cn(
      "w-[280px] h-full flex flex-col",
      "bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl",
      "border-r border-white/20 dark:border-white/[0.08]",
      "shadow-[4px_0_24px_rgba(0,0,0,0.04)] dark:shadow-[4px_0_28px_rgba(0,0,0,0.3)]"
    )}>
      {/* Subtle gradient tint at top */}
      <div 
        className="h-1 w-full opacity-50"
        style={{ 
          background: `linear-gradient(90deg, ${projectColor || '#6366f1'}, transparent)` 
        }}
      />

      {/* Project Header */}
      <div className="p-4 border-b border-white/10 dark:border-white/[0.06]">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={cn(
                "w-3.5 h-3.5 rounded-full shrink-0 ring-2 ring-offset-2 ring-offset-background",
                "shadow-[0_0_8px_currentColor]"
              )}
              style={{ 
                backgroundColor: projectColor || '#6366f1',
                color: projectColor || '#6366f1'
              }}
            />
            <h2 className="font-semibold text-sm truncate text-foreground">{projectName}</h2>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-7 w-7 p-0 shrink-0 rounded-lg transition-all duration-200",
              "hover:bg-white/40 dark:hover:bg-white/10",
              isPinned && "text-amber-500 bg-amber-500/10"
            )}
            onClick={onTogglePin}
          >
            {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </Button>
        </div>

        {/* Type & Status badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className={cn("text-xs gap-1 font-medium", typeConfig.bgColor, typeConfig.color)}>
            <TypeIcon className="w-3 h-3" />
            {typeConfig.label}
          </Badge>
          <Badge variant="secondary" className={cn("text-xs gap-1 font-medium", statusConfig.bgColor, statusConfig.color)}>
            <span className={cn(
              "w-1.5 h-1.5 rounded-full",
              statusConfig.dotColor,
              projectStatus === 'active' && "shadow-[0_0_6px_currentColor]"
            )} />
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      {/* Stats - Mini metrics block */}
      <div className="p-4 border-b border-white/10 dark:border-white/[0.06]">
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Tasks', value: `${stats.completedTasksCount}/${stats.tasksCount}`, icon: CheckSquare },
            { label: 'Notes', value: stats.notesCount, icon: FileText },
            { label: 'Reading', value: stats.readingItemsCount, icon: BookOpen },
            { label: 'Prompts', value: stats.promptsCount, icon: Sparkles },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div 
                key={stat.label}
                className={cn(
                  "p-2.5 rounded-xl text-center",
                  "bg-white/40 dark:bg-white/[0.04]",
                  "border border-white/30 dark:border-white/[0.06]"
                )}
              >
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground font-medium flex items-center justify-center gap-1">
                  <Icon className="w-3 h-3" />
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
        
        {/* Last updated */}
        {lastUpdated && (
          <div className="flex items-center gap-1.5 mt-3 text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Updated {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}</span>
          </div>
        )}
      </div>

      {/* Section Filters */}
      <div className="flex-1 p-3 overflow-y-auto">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em] mb-2 px-2">
          Sections
        </p>
        <div className="space-y-1">
          {SECTIONS.map((section) => {
            const count = getSectionCount(section.id);
            const SectionIcon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-200",
                  isActive
                    ? cn(
                        "bg-primary/10 text-primary font-medium",
                        "ring-2 ring-primary/20",
                        "shadow-[0_0_12px_rgba(99,102,241,0.1)]"
                      )
                    : "text-muted-foreground hover:text-foreground hover:bg-white/40 dark:hover:bg-white/[0.06]"
                )}
                onClick={() => onSectionChange(section.id)}
              >
                <SectionIcon className={cn("w-4 h-4", isActive && "text-primary")} />
                <span className="flex-1 text-left">{section.label}</span>
                {count !== null && (
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-md font-medium",
                    isActive 
                      ? "bg-primary/20 text-primary" 
                      : "bg-muted/50 text-muted-foreground"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Status Change */}
      <div className="p-3 border-t border-white/10 dark:border-white/[0.06]">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em] mb-2 px-2">
          Change Status
        </p>
        <div className="flex flex-wrap gap-1.5">
          {Object.values(PROJECT_STATUSES).map((status) => {
            const isActive = projectStatus === status.value;
            return (
              <Button
                key={status.value}
                size="sm"
                variant="ghost"
                className={cn(
                  "h-7 px-2.5 text-xs rounded-lg transition-all duration-200",
                  isActive 
                    ? cn(status.bgColor, status.color, "ring-2 ring-primary/20")
                    : "text-muted-foreground hover:text-foreground hover:bg-white/40 dark:hover:bg-white/[0.06]"
                )}
                onClick={() => onStatusChange(status.value as ProjectStatus)}
              >
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full mr-1.5",
                  status.dotColor,
                  isActive && "shadow-[0_0_6px_currentColor]"
                )} />
                {status.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
