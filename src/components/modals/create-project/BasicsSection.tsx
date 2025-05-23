
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Control } from "react-hook-form";
import { CreateProjectFormData } from "./schema";

interface BasicsSectionProps {
  control: Control<CreateProjectFormData>;
}

export function BasicsSection({ control }: BasicsSectionProps) {
  return (
    <div className="space-y-4 pt-0">
      <h3 className="text-sm font-medium text-muted-foreground">
        Basics
      </h3>
      
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium text-muted-foreground">
              Project Name
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="Enter project name"
                className="bg-background/80 border border-muted/30 text-foreground placeholder:text-muted-foreground rounded-md focus:ring-2 focus:ring-cyan-500 transition"
                autoFocus
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium text-muted-foreground">
              Description
            </FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="Describe your project (optional)"
                className="bg-background/80 border border-muted/30 text-foreground placeholder:text-muted-foreground rounded-md focus:ring-2 focus:ring-cyan-500 transition min-h-[80px]"
                rows={3}
              />
            </FormControl>
            <FormDescription className="text-xs text-muted-foreground">
              Optional: Brief description of your project
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
