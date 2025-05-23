
import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Plus, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const colorSwatches = [
  { name: "Pink", value: "#FF1464" },
  { name: "Blue", value: "#2B2DFF" },
  { name: "Cyan", value: "#00CFDD" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Green", value: "#10B981" },
  { name: "Orange", value: "#F59E0B" },
];

const formSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  color: z.string().default("#FF1464"),
  dueDate: z.date().optional(),
  resources: z.array(
    z.object({
      title: z.string(),
      url: z.string().refine((val) => {
        if (!val || val.trim() === "") return true;
        return val.startsWith("https://");
      }, "URL must start with https://"),
    })
  ).default([]).superRefine((resources, ctx) => {
    resources.forEach((resource, index) => {
      if (resource.url && resource.url.trim() !== "" && (!resource.title || resource.title.trim() === "")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Resource title is required when URL is provided",
          path: [index, "title"],
        });
      }
    });
  }),
});

type FormData = z.infer<typeof formSchema>;

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject?: (data: FormData) => void;
}

export function CreateProjectModal({
  open,
  onOpenChange,
  onCreateProject,
}: CreateProjectModalProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#FF1464",
      resources: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "resources",
  });

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      form.reset({
        name: "",
        description: "",
        color: "#FF1464",
        resources: [],
      });
      setShowSuccess(false);
    }
  }, [open, form]);

  const onSubmit = async (data: FormData) => {
    // Filter out empty resources
    const filteredResources = data.resources.filter(
      (resource) => resource.title.trim() !== "" || resource.url.trim() !== ""
    );
    
    const finalData = {
      ...data,
      resources: filteredResources,
    };

    // Show success animation
    setShowSuccess(true);
    
    // Call the callback after a brief delay
    setTimeout(() => {
      onCreateProject?.(finalData);
      onOpenChange(false);
    }, 1000);
  };

  const addResource = () => {
    append({ title: "", url: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl bg-white/10 dark:bg-zinc-900/30 backdrop-blur-sm ring-1 ring-white/10 dark:ring-white/5 shadow-2xl transition-all">
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
                className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4"
              >
                <Check className="w-8 h-8 text-white" />
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg font-semibold text-gray-900 dark:text-gray-100"
              >
                Project Created!
              </motion.h3>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  New Project
                </DialogTitle>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 divide-y divide-muted/20">
                  {/* Basics Section */}
                  <div className="space-y-4 pt-0">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Basics
                    </h3>
                    
                    <FormField
                      control={form.control}
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
                      control={form.control}
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

                  {/* Meta Section */}
                  <div className="space-y-4 pt-6">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Meta
                    </h3>

                    <FormField
                      control={form.control}
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

                    <FormField
                      control={form.control}
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

                  {/* Resources Section */}
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
                                  control={form.control}
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
                                  control={form.control}
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

                  {/* Actions */}
                  <div className="flex flex-col gap-2 pt-6 mt-6">
                    <Button
                      type="submit"
                      className="w-full py-2 rounded-md bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium transition shadow"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting ? "Creating..." : "Create Project"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => onOpenChange(false)}
                      className="w-full text-sm text-muted-foreground hover:text-foreground transition"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
