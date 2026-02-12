import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavSectionHeaderProps {
  title: string;
  expanded: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function NavSectionHeader({ title, expanded, isOpen = true, onToggle }: NavSectionHeaderProps) {
  if (!expanded) return null;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      className={cn(
        "flex w-full items-center justify-between px-4 py-2 mb-1 rounded-md transition-colors",
        onToggle && "hover:bg-white/5 cursor-pointer"
      )}
    >
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {title}
      </h3>
      {onToggle && (
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
            isOpen ? "rotate-0" : "-rotate-90"
          )}
        />
      )}
    </button>
  );
}
