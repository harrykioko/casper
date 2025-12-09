import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Control } from "react-hook-form";
import { CreateProjectFormData, colorSwatches } from "./schema";
import { PROJECT_TYPE_OPTIONS } from "@/lib/constants/projectTypes";

interface MetaSectionProps {
  control: Control<CreateProjectFormData>;
}

export function MetaSection({ control }: MetaSectionProps) {
  return (
    <div className="space-y-4 pt-6">
      <h3 className="text-sm font-medium text-muted-foreground">
        Meta
      </h3>

      {/* Project Type */}
      <FormField
        control={control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium text-muted-foreground">
              Project Type
            </FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="bg-background/80 border border-muted/30">
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {PROJECT_TYPE_OPTIONS.map((type) => {
                  const TypeIcon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <TypeIcon className={cn("w-4 h-4", type.color)} />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Color */}
      <FormField
        control={control}
        name="color"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium text-muted-foreground">
              Color
            </FormLabel>
            <FormControl>
              <div className="flex gap-2 flex-wrap">
                {colorSwatches.map((swatch) => (
                  <button
                    key={swatch.value}
                    type="button"
                    className={cn(
                      "w-6 h-6 rounded-full border-2 border-white/10 ring-offset-2 focus:outline-none focus:ring-2 focus:ring-[#FF1464] transition-all",
                      field.value === swatch.value && `ring-2 ring-[${swatch.value}]`
                    )}
                    style={{ backgroundColor: swatch.value }}
                    onClick={() => field.onChange(swatch.value)}
                    title={swatch.name}
                  />
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Due Date */}
      <FormField
        control={control}
        name="dueDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium text-muted-foreground">
              Due Date
            </FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className="w-full pl-3 text-left font-normal bg-background/80 border border-muted/30 text-foreground placeholder:text-muted-foreground rounded-md focus:ring-2 focus:ring-cyan-500 transition"
                  >
                    {field.value ? (
                      format(field.value, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <FormDescription className="text-xs text-muted-foreground">
              Optional: When should this project be completed?
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
