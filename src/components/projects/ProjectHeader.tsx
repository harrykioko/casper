import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pin, PinOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  PROJECT_TYPES, 
  PROJECT_STATUSES, 
  ProjectType, 
  ProjectStatus 
} from "@/lib/constants/projectTypes";

interface ProjectHeaderProps {
  projectName: string;
  projectColor: string;
  projectType?: ProjectType;
  projectStatus?: ProjectStatus;
  isPinned?: boolean;
  onTogglePin?: () => void;
  openCommandModal: () => void;
}

export function ProjectHeader({ 
  projectName, 
  projectColor, 
  projectType = 'other',
  projectStatus = 'active',
  isPinned = false,
  onTogglePin,
  openCommandModal 
}: ProjectHeaderProps) {
  const navigate = useNavigate();
  const typeConfig = PROJECT_TYPES[projectType] || PROJECT_TYPES.other;
  const statusConfig = PROJECT_STATUSES[projectStatus] || PROJECT_STATUSES.active;
  const TypeIcon = typeConfig.icon;
  
  return (
    <>
      <div className="sticky top-0 z-30 w-full -mx-8 px-6 py-3 bg-white/60 dark:bg-zinc-900/50 backdrop-blur-sm border-b border-black/10 dark:border-white/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => navigate("/projects")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div 
                className="h-4 w-4 rounded-md" 
                style={{ backgroundColor: projectColor }}
              />
              <h1 className="text-xl font-semibold">{projectName}</h1>
              <Badge variant="secondary" className={cn("text-xs gap-1", typeConfig.bgColor, typeConfig.color)}>
                <TypeIcon className="w-3 h-3" />
                {typeConfig.label.split(' / ')[0]}
              </Badge>
              <Badge variant="secondary" className={cn("text-xs gap-1", statusConfig.bgColor, statusConfig.color)}>
                <span className={cn("w-1.5 h-1.5 rounded-full", statusConfig.dotColor)} />
                {statusConfig.label}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onTogglePin && (
              <Button
                variant="ghost"
                size="icon"
                className={cn("rounded-full", isPinned && "text-amber-500")}
                onClick={onTogglePin}
              >
                {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              </Button>
            )}
            <Button 
              variant="outline"
              className="glassmorphic"
              onClick={openCommandModal}
            >
              <span className="sr-only">Command</span>
              <kbd className="text-xs bg-muted px-2 py-0.5 rounded">⌘K</kbd>
            </Button>
          </div>
        </div>
      </div>
      <div className="h-0.5 w-full -mx-8 mb-6" style={{ backgroundColor: projectColor }}></div>
    </>
  );
}
