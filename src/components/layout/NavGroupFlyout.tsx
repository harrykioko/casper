import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";

interface NavGroupItem {
  icon: LucideIcon;
  path: string;
  label: string;
  active: boolean;
}

interface NavGroupFlyoutProps {
  title: string;
  items: NavGroupItem[];
}

export function NavGroupFlyout({ title, items }: NavGroupFlyoutProps) {
  return (
    <HoverCard openDelay={150} closeDelay={300}>
      <HoverCardTrigger asChild>
        <div className="flex flex-col gap-1 w-full">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-md transition-colors",
                  item.active
                    ? "text-zinc-900 dark:text-white bg-white/20 dark:bg-white/10 font-semibold shadow-sm"
                    : "text-zinc-700 dark:text-white/70 hover:text-[#FF6A79] dark:hover:text-[#FF6A79]"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {item.active && (
                  <span className="absolute top-1/2 -translate-y-1/2 -left-1 w-1 h-5 bg-gradient-to-b from-[#FF6A79] to-[#415AFF] rounded-r-full" />
                )}
              </Link>
            );
          })}
        </div>
      </HoverCardTrigger>
      <HoverCardContent
        side="right"
        sideOffset={8}
        className="w-auto min-w-[160px] p-2 backdrop-blur-xl bg-white/75 dark:bg-zinc-900/70 border-white/20 shadow-glass-dark"
      >
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 pb-1.5">
          {title}
        </p>
        <div className="flex flex-col gap-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors",
                  item.active
                    ? "text-zinc-900 dark:text-white bg-white/20 dark:bg-white/10 font-semibold"
                    : "text-zinc-700 dark:text-white/70 hover:text-[#FF6A79] dark:hover:text-[#FF6A79] hover:bg-white/10"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
