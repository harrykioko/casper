
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateSelectorProps {
  scheduledFor?: Date;
  onSelectDate: (date?: Date) => void;
}

export function DateSelector({ scheduledFor, onSelectDate }: DateSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium block">Due Date</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left relative pl-10 bg-white/5 border border-white/10 hover:bg-white/10 rounded-md text-sm py-2",
              !scheduledFor && "text-white/40"
            )}
          >
            <CalendarIcon className="absolute left-3 top-2 h-4 w-4 text-white/40" />
            {scheduledFor ? format(scheduledFor, "PPP") : "Select a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white/10 backdrop-blur-md border border-white/10" align="start">
          <Calendar
            mode="single"
            selected={scheduledFor}
            onSelect={onSelectDate}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
      {scheduledFor && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs text-white/60 hover:text-white"
          onClick={() => onSelectDate(undefined)}
        >
          Clear date
        </Button>
      )}
    </div>
  );
}
