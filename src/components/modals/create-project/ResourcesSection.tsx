
import { Plus, X } from "lucide-react";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Control, useFieldArray } from "react-hook-form";
import { CreateProjectFormData } from "./schema";

interface ResourcesSectionProps {
  control: Control<CreateProjectFormData>;
}

export function ResourcesSection({ control }: ResourcesSectionProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "resources",
  });

  const addResource = () => {
    append({ title: "", url: "" });
  };

  return (
    <div className="space-y-4 pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Resources (optional)
        </h3>
      </div>

      {fields.length > 0 && (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="bg-white/5 dark:bg-zinc-800/30 p-4 rounded-md">
              <div className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <FormField
                    control={control}
                    name={`resources.${index}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Resource title"
                            className="bg-background/80 border border-muted/30 text-foreground placeholder:text-muted-foreground rounded-md focus:ring-2 focus:ring-cyan-500 transition"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`resources.${index}.url`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="https://..."
                            className="bg-background/80 border border-muted/30 text-foreground placeholder:text-muted-foreground rounded-md focus:ring-2 focus:ring-cyan-500 transition"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  className="mt-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={addResource}
        className="w-full py-2 px-3 flex items-center justify-center text-sm font-medium text-muted-foreground bg-white/5 hover:bg-white/10 rounded-md border border-white/10 transition"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Another Link
      </Button>
    </div>
  );
}
