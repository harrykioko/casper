import { Zap, Timer, Hourglass } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardEffortProps {
  effortMinutes?: number | null;
  effortCategory?: 'quick' | 'medium' | 'deep' | 'unknown' | null;
  className?: string;
}

const EFFORT_CONFIG = {
  quick: { 
    label: "5m", 
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    Icon: Zap 
  },
  medium: { 
    label: "15m", 
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    Icon: Timer 
  },
  deep: { 
    label: "1h+", 
    className: "bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20",
    Icon: Hourglass 
  },
  unknown: null,
};

function getEffortFromMinutes(minutes: number | null | undefined): 'quick' | 'medium' | 'deep' | null {
  if (!minutes) return null;
  if (minutes <= 10) return 'quick';
  if (minutes <= 30) return 'medium';
  return 'deep';
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function TaskCardEffort({ effortMinutes, effortCategory, className }: TaskCardEffortProps) {
  // Determine category from minutes if not provided
  const category = effortCategory || getEffortFromMinutes(effortMinutes);
  
  if (!category || category === 'unknown') return null;
  
  const config = EFFORT_CONFIG[category];
  if (!config) return null;

  const { Icon } = config;
  const displayLabel = effortMinutes ? formatMinutes(effortMinutes) : config.label;

  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border",
      config.className,
      className
    )}>
      <Icon className="h-2.5 w-2.5" />
      {displayLabel}
    </span>
  );
}
