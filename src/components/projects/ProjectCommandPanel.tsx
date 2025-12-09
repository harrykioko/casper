import { Folder, FileText, CheckSquare, BookOpen, Sparkles, Link, Pin, PinOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PROJECT_TYPES, PROJECT_STATUSES, ProjectType, ProjectStatus } from '@/lib/constants/projectTypes';

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
    <div className="w-[280px] h-full flex flex-col border-r border-border/50 bg-background/50 backdrop-blur-sm">
      {/* Project Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: projectColor || '#6366f1' }}
            />
            <h2 className="font-semibold text-sm truncate">{projectName}</h2>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-7 w-7 p-0 shrink-0",
              isPinned && "text-amber-500"
            )}
            onClick={onTogglePin}
          >
            {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </Button>
        </div>

        {/* Type & Status badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className={cn("text-xs gap-1", typeConfig.bgColor, typeConfig.color)}>
            <TypeIcon className="w-3 h-3" />
            {typeConfig.label}
          </Badge>
          <Badge variant="secondary" className={cn("text-xs gap-1", statusConfig.bgColor, statusConfig.color)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", statusConfig.dotColor)} />
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 border-b border-border/50">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <p className="text-lg font-semibold">{stats.notesCount}</p>
            <p className="text-xs text-muted-foreground">Notes</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">
              {stats.completedTasksCount}/{stats.tasksCount}
            </p>
            <p className="text-xs text-muted-foreground">Tasks</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">{stats.readingItemsCount}</p>
            <p className="text-xs text-muted-foreground">Reading</p>
          </div>
        </div>
      </div>

      {/* Section Filters */}
      <div className="flex-1 p-3 overflow-y-auto">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2">
          Sections
        </p>
        <div className="space-y-0.5">
          {SECTIONS.map((section) => {
            const count = getSectionCount(section.id);
            const SectionIcon = section.icon;
            return (
              <button
                key={section.id}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                  activeSection === section.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                onClick={() => onSectionChange(section.id)}
              >
                <SectionIcon className="w-4 h-4" />
                <span className="flex-1 text-left">{section.label}</span>
                {count !== null && (
                  <span className="text-xs opacity-60">{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Status Change */}
      <div className="p-3 border-t border-border/50">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2">
          Change Status
        </p>
        <div className="flex flex-wrap gap-1">
          {Object.values(PROJECT_STATUSES).map((status) => (
            <Button
              key={status.value}
              size="sm"
              variant={projectStatus === status.value ? "secondary" : "ghost"}
              className={cn(
                "h-6 px-2 text-xs",
                projectStatus === status.value && status.bgColor
              )}
              onClick={() => onStatusChange(status.value as ProjectStatus)}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full mr-1", status.dotColor)} />
              {status.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
