import { ReactNode } from "react";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { NavSectionHeader } from "./NavSectionHeader";

interface NavSectionProps {
  title?: string;
  children: ReactNode;
  expanded: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

export function NavSection({ title, children, expanded, isOpen = true, onToggle, className = "" }: NavSectionProps) {
  // No collapsible behavior (e.g. standalone Home item)
  if (!onToggle) {
    return (
      <div className={`w-full ${className}`}>
        {title && <NavSectionHeader title={title} expanded={expanded} />}
        <div className="flex flex-col gap-1">
          {children}
        </div>
      </div>
    );
  }

  // Collapsed sidebar: skip collapsible, render children directly (icons always visible)
  if (!expanded) {
    return (
      <div className={`w-full ${className}`}>
        <div className="flex flex-col gap-1">
          {children}
        </div>
      </div>
    );
  }

  // Expanded sidebar with collapsible sections
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle} className={`w-full ${className}`}>
      {title && (
        <NavSectionHeader
          title={title}
          expanded={expanded}
          isOpen={isOpen}
          onToggle={onToggle}
        />
      )}
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <div className="flex flex-col gap-1">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
