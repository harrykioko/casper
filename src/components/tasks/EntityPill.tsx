import { Mail, Building2, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LinkedEntity } from "@/hooks/useEnrichedTasks";

interface EntityPillProps {
  entity: LinkedEntity | undefined;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export function EntityPill({ entity, onClick, size = 'sm' }: EntityPillProps) {
  if (!entity) return null;

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const pillSize = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full transition-colors",
        "bg-muted/60 hover:bg-muted",
        "max-w-[140px] truncate",
        pillSize
      )}
      type="button"
    >
      {entity.type === 'email' ? (
        <Mail className={cn(iconSize, "text-sky-500 flex-shrink-0")} />
      ) : entity.logo_url ? (
        <img 
          src={entity.logo_url} 
          className={cn(iconSize, "rounded-sm object-contain flex-shrink-0")} 
          alt="" 
        />
      ) : entity.color ? (
        <div 
          className={cn(iconSize, "rounded-sm flex-shrink-0")} 
          style={{ backgroundColor: entity.color }} 
        />
      ) : entity.type === 'project' ? (
        <FolderKanban className={cn(iconSize, "text-muted-foreground flex-shrink-0")} />
      ) : (
        <Building2 className={cn(iconSize, "text-muted-foreground flex-shrink-0")} />
      )}
      <span className="truncate text-muted-foreground font-medium">{entity.name}</span>
    </button>
  );
}
