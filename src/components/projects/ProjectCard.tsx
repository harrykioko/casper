import { Link } from "react-router-dom";
import { Pin, FolderKanban, FileText, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { 
  PROJECT_TYPES, 
  PROJECT_STATUSES, 
  ProjectStatus, 
  ProjectType 
} from "@/lib/constants/projectTypes";

interface ProjectCardProps {
  id: string;
  name: string;
  description: string;
  color: string;
  type: ProjectType;
  status: ProjectStatus;
  isPinned: boolean;
  taskCount: number;
  completedTaskCount: number;
  promptCount: number;
  notesCount?: number;
  lastUpdated?: string;
  nextTaskDue?: string;
}

export function ProjectCard({
  id,
  name,
  description,
  color,
  type,
  status,
  isPinned,
  taskCount,
  completedTaskCount,
  promptCount,
  notesCount = 0,
  lastUpdated,
  nextTaskDue,
}: ProjectCardProps) {
  const progressPercentage = taskCount > 0 
    ? (completedTaskCount / taskCount) * 100 
    : 0;
  const typeConfig = PROJECT_TYPES[type] || PROJECT_TYPES.other;
  const statusConfig = PROJECT_STATUSES[status] || PROJECT_STATUSES.active;
  const TypeIcon = typeConfig.icon;

  return (
    <Link
      to={`/projects/${id}`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/50 rounded-2xl"
    >
      <div
        className={cn(
          "relative h-full rounded-2xl overflow-hidden transition-all duration-300",
          "bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl",
          "border border-white/30 dark:border-white/[0.08]",
          "shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]",
          "hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_12px_44px_rgba(0,0,0,0.5)]",
          "hover:translate-y-[-3px] hover:scale-[1.01]",
          "group"
        )}
      >
        {/* Left accent gradient strip */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-1 opacity-80"
          style={{ 
            background: `linear-gradient(180deg, ${color}, ${color}88)` 
          }}
        />

        {/* Pin indicator */}
        {isPinned && (
          <div className="absolute top-3 right-3 z-10">
            <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          </div>
        )}

        <div className="p-5 pl-4">
          {/* Title */}
          <h3 className="font-semibold text-base text-foreground mb-2 pr-6 line-clamp-1">
            {name}
          </h3>

          {/* Type & Status */}
          <div className="flex items-center gap-2 mb-3">
            <Badge 
              variant="secondary" 
              className={cn(
                "text-[10px] h-5 gap-1 px-1.5 font-medium",
                typeConfig.bgColor, 
                typeConfig.color
              )}
            >
              <TypeIcon className="w-2.5 h-2.5" />
              {typeConfig.label.split(' / ')[0]}
            </Badge>
            
            {/* Status with glowing dot */}
            <div className={cn(
              "flex items-center gap-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md",
              statusConfig.bgColor,
              statusConfig.color
            )}>
              <span 
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  statusConfig.dotColor,
                  status === 'active' && "shadow-[0_0_6px_currentColor]"
                )} 
              />
              {statusConfig.label}
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
            {description || 'No description'}
          </p>

          {/* Progress bar */}
          <Progress 
            value={progressPercentage} 
            className="h-1 rounded-full bg-muted/40 dark:bg-muted/20 mb-3" 
          />

          {/* Bottom metadata row */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-white/10 dark:border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <FolderKanban className="h-3 w-3" />
                <span>{taskCount} tasks</span>
              </div>
              {notesCount > 0 && (
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  <span>{notesCount}</span>
                </div>
              )}
            </div>
            
            {lastUpdated && (
              <div className="flex items-center gap-1 opacity-70">
                <Clock className="h-3 w-3" />
                <span>{formatDistanceToNow(new Date(lastUpdated), { addSuffix: false })}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
