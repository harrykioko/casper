
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
    <div className="space-y-1">
      <label className="text-sm text-muted-foreground mb-1 block">Due Date</label>
      <div className="relative">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left relative pl-9 bg-muted/20 border border-muted/40 rounded-md text-base py-2",
                !scheduledFor && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              {scheduledFor ? format(scheduledFor, "PPP") : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-popover backdrop-blur-md border border-muted/40 z-50" align="start">
            <Calendar
              mode="single"
              selected={scheduledFor}
              onSelect={onSelectDate}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
      {scheduledFor && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:underline mt-1 h-auto p-0"
          onClick={() => onSelectDate(undefined)}
        >
          Clear date
        </Button>
      )}
    </div>
  );
}
