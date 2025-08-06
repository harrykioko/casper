import { ReactNode } from "react";
import { NavSectionHeader } from "./NavSectionHeader";

interface NavSectionProps {
  title?: string;
  children: ReactNode;
  expanded: boolean;
  className?: string;
}

export function NavSection({ title, children, expanded, className = "" }: NavSectionProps) {
  return (
    <div className={`w-full ${className}`}>
      {title && <NavSectionHeader title={title} expanded={expanded} />}
      <div className="flex flex-col gap-2">
        {children}
      </div>
    </div>
  );
}