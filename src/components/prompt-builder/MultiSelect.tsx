import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface MultiSelectProps {
  label: string;
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  singleSelect?: boolean;
}

export function MultiSelect({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = "Select options",
  singleSelect = false
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (value: string) => {
    if (singleSelect) {
      onChange([value]);
      setOpen(false);
      return;
    }

    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    
    onChange(newValues);
  };

  const displayText = selectedValues.length > 0
    ? singleSelect 
      ? selectedValues[0]
      : `${selectedValues.length} selected`
    : placeholder;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-left font-normal glassmorphic border-white/20 hover:border-primary/30"
          >
            <span className={cn(
              selectedValues.length === 0 && "text-muted-foreground"
            )}>
              {displayText}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 glassmorphic border-white/20">
          <div className="max-h-60 overflow-auto p-1">
            {options.map((option) => (
              <div
                key={option}
                className="flex items-center space-x-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
                onClick={() => handleSelect(option)}
              >
                {singleSelect ? (
                  <Check
                    className={cn(
                      "h-4 w-4",
                      selectedValues.includes(option) ? "opacity-100" : "opacity-0"
                    )}
                  />
                ) : (
                  <Checkbox
                    checked={selectedValues.includes(option)}
                    onChange={() => {}}
                  />
                )}
                <span>{option}</span>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      
      {!singleSelect && selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedValues.map((value) => (
            <Badge
              key={value}
              variant="secondary"
              className="text-xs"
            >
              {value}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}