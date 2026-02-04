import { useState } from "react";
import { Zap, Timer, Hourglass } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface TaskCardEffortProps {
  effortMinutes?: number | null;
  effortCategory?: 'quick' | 'medium' | 'deep' | 'unknown' | null;
  editable?: boolean;
  onEdit?: (minutes: number, category: string) => void;
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

const EFFORT_OPTIONS = [
  { minutes: 5, label: '5m', category: 'quick' },
  { minutes: 15, label: '15m', category: 'quick' },
  { minutes: 30, label: '30m', category: 'medium' },
  { minutes: 60, label: '1h', category: 'deep' },
  { minutes: 120, label: '2h+', category: 'deep' },
];

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

export function TaskCardEffort({ 
  effortMinutes, 
  effortCategory, 
  editable = false,
  onEdit,
  className 
}: TaskCardEffortProps) {
  const [open, setOpen] = useState(false);

  // Determine category from minutes if not provided
  const category = effortCategory || getEffortFromMinutes(effortMinutes);
  
  if (!category || category === 'unknown') {
    // If editable but no value, show a placeholder
    if (editable && onEdit) {
      return (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button 
              className={cn(
                "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border",
                "bg-muted/50 text-muted-foreground border-muted/50",
                "hover:bg-muted cursor-pointer transition-colors",
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <Timer className="h-2.5 w-2.5" />
              Set
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex gap-1">
              {EFFORT_OPTIONS.map((option) => (
                <Button
                  key={option.minutes}
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    onEdit(option.minutes, option.category);
                    setOpen(false);
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      );
    }
    return null;
  }
  
  const config = EFFORT_CONFIG[category];
  if (!config) return null;

  const { Icon } = config;
  const displayLabel = effortMinutes ? formatMinutes(effortMinutes) : config.label;

  const baseStyles = "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border";

  if (editable && onEdit) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button 
            className={cn(baseStyles, config.className, "cursor-pointer hover:opacity-80 transition-opacity", className)}
            onClick={(e) => e.stopPropagation()}
          >
            <Icon className="h-2.5 w-2.5" />
            {displayLabel}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-1">
            {EFFORT_OPTIONS.map((option) => (
              <Button
                key={option.minutes}
                variant={option.minutes === effortMinutes ? "default" : "outline"}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  onEdit(option.minutes, option.category);
                  setOpen(false);
                }}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <span className={cn(baseStyles, config.className, className)}>
      <Icon className="h-2.5 w-2.5" />
      {displayLabel}
    </span>
  );
}
