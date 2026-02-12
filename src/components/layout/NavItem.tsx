
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItemProps {
  icon: LucideIcon;
  path: string;
  label: string;
  active: boolean;
  expanded: boolean;
  showTooltip?: boolean;
}

export function NavItem({ icon: Icon, path, label, active, expanded, showTooltip = true }: NavItemProps) {
  const link = (
    <Link
      to={path}
      className={cn(
        "relative flex h-10 items-center rounded-md transition-colors",
        expanded ? "w-[90%] px-4 justify-start" : "w-10 justify-center",
        active
          ? "text-zinc-900 dark:text-white bg-white/20 dark:bg-white/10 font-semibold shadow-sm"
          : "text-zinc-700 dark:text-white/70 hover:text-[#FF6A79] dark:hover:text-[#FF6A79]"
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      {active && (
        <span className={cn(
          "absolute top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-[#FF6A79] to-[#415AFF] rounded-r-full",
          expanded ? "left-0" : "-left-1"
        )} />
      )}
      {expanded && (
        <span className="ml-3 text-sm">{label}</span>
      )}
    </Link>
  );

  // When tooltip is disabled or sidebar is expanded, render without tooltip wrapper
  if (!showTooltip || expanded) {
    return link;
  }

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        {link}
      </TooltipTrigger>
      <TooltipContent side="right" className="glassmorphic">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
