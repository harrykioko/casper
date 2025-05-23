
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormLabel, FormMessage, Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const resourceSchema = z.object({
  title: z.string().min(1, "Resource title is required"),
  url: z.string()
    .min(1, "URL is required")
    .refine((val) => val.startsWith("https://"), "URL must start with https://")
});

type ResourceFormValues = z.infer<typeof resourceSchema>;

interface AddResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddResource: (resource: { title: string; url: string }) => void;
}

export function AddResourceDialog({ open, onOpenChange, onAddResource }: AddResourceDialogProps) {
  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: "",
      url: "https://"
    }
  });
  
  const handleSubmit = (values: ResourceFormValues) => {
    onAddResource(values);
    form.reset();
    onOpenChange(false);
    toast.success("Resource added successfully");
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl bg-white/10 dark:bg-zinc-900/30 backdrop-blur-sm ring-1 ring-white/10 dark:ring-white/5 shadow-2xl transition-all">
        <DialogHeader>
          <DialogTitle>Add Resource</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resource Title</FormLabel>
                  <Input 
                    {...field}
                    placeholder="Enter resource title" 
                    autoFocus
                    className="bg-background/80 border border-muted/30 text-foreground placeholder:text-muted-foreground rounded-md focus:ring-2 focus:ring-cyan-500 transition"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <Input 
                    {...field}
                    placeholder="https://" 
                    className="bg-background/80 border border-muted/30 text-foreground placeholder:text-muted-foreground rounded-md focus:ring-2 focus:ring-cyan-500 transition"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-full py-2 rounded-md bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium transition shadow"
              >
                Add Resource
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
