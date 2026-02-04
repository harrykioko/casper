import { useState } from "react";
import { 
  Clock, 
  Calendar as CalendarIcon, 
  MoreHorizontal, 
  Trash2, 
  Archive,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { addHours, addDays, setHours, setMinutes, nextMonday } from "date-fns";

interface InlineTaskActionsProps {
  taskId: string;
  onSnooze: (until: Date) => void;
  onReschedule: (date: Date) => void;
  onUpdatePriority: (priority: string) => void;
  onUpdateEffort: (minutes: number, category: string) => void;
  onArchive?: () => void;
  onDelete?: () => void;
  variant?: 'compact' | 'full';
  className?: string;
}

const SNOOZE_OPTIONS = [
  { label: "In 1 hour", hours: 1 },
  { label: "In 4 hours", hours: 4 },
  { label: "Tomorrow morning", hours: null, tomorrow: true },
  { label: "Next week", hours: null, nextWeek: true },
];

const EFFORT_OPTIONS = [
  { minutes: 5, label: '5m', category: 'quick' },
  { minutes: 15, label: '15m', category: 'quick' },
  { minutes: 30, label: '30m', category: 'medium' },
  { minutes: 60, label: '1h', category: 'deep' },
  { minutes: 120, label: '2h+', category: 'deep' },
];

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High', icon: ArrowUp, className: 'text-destructive' },
  { value: 'medium', label: 'Medium', icon: ArrowRight, className: 'text-amber-500' },
  { value: 'low', label: 'Low', icon: ArrowDown, className: 'text-sky-500' },
];

function getSnoozeTime(option: typeof SNOOZE_OPTIONS[0]): Date {
  const now = new Date();
  if (option.hours) {
    return addHours(now, option.hours);
  }
  if (option.tomorrow) {
    return setMinutes(setHours(addDays(now, 1), 9), 0);
  }
  if (option.nextWeek) {
    return setMinutes(setHours(nextMonday(now), 9), 0);
  }
  return addHours(now, 1);
}

export function InlineTaskActions({
  taskId,
  onSnooze,
  onReschedule,
  onUpdatePriority,
  onUpdateEffort,
  onArchive,
  onDelete,
  variant = 'full',
  className,
}: InlineTaskActionsProps) {
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  const buttonSize = variant === 'compact' ? 'h-6 w-6' : 'h-7 w-7';
  const iconSize = variant === 'compact' ? 'h-3 w-3' : 'h-3.5 w-3.5';

  return (
    <div className={cn("flex items-center gap-0.5", className)} onClick={(e) => e.stopPropagation()}>
      {/* Snooze */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className={cn(buttonSize, "rounded-full text-muted-foreground hover:text-foreground")}
          >
            <Clock className={iconSize} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {SNOOZE_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.label}
              onClick={() => onSnooze(getSnoozeTime(option))}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Reschedule */}
      <Popover open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className={cn(buttonSize, "rounded-full text-muted-foreground hover:text-foreground")}
          >
            <CalendarIcon className={iconSize} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            onSelect={(date) => {
              if (date) {
                onReschedule(date);
                setRescheduleOpen(false);
              }
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* More actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className={cn(buttonSize, "rounded-full text-muted-foreground hover:text-foreground")}
          >
            <MoreHorizontal className={iconSize} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* Priority */}
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Priority</div>
          {PRIORITY_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onUpdatePriority(option.value)}
              className="gap-2"
            >
              <option.icon className={cn("h-3.5 w-3.5", option.className)} />
              {option.label}
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          {/* Effort */}
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Effort</div>
          <div className="flex gap-1 px-2 pb-2">
            {EFFORT_OPTIONS.map((option) => (
              <Button
                key={option.minutes}
                variant="outline"
                size="sm"
                className="h-6 px-2 text-[10px]"
                onClick={() => onUpdateEffort(option.minutes, option.category)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          
          <DropdownMenuSeparator />
          
          {onArchive && (
            <DropdownMenuItem onClick={onArchive} className="gap-2">
              <Archive className="h-3.5 w-3.5" />
              Archive
            </DropdownMenuItem>
          )}
          
          {onDelete && (
            <DropdownMenuItem onClick={onDelete} className="gap-2 text-destructive focus:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
