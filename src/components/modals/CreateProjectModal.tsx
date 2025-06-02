
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

import { createProjectFormSchema, CreateProjectFormData } from "./create-project/schema";
import { BasicsSection } from "./create-project/BasicsSection";
import { MetaSection } from "./create-project/MetaSection";
import { ResourcesSection } from "./create-project/ResourcesSection";

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject?: (data: CreateProjectFormData) => void;
}

export function CreateProjectModal({
  open,
  onOpenChange,
  onCreateProject,
}: CreateProjectModalProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectFormSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#FF1464",
      resources: [],
    },
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

  const onSubmit = async (data: CreateProjectFormData) => {
    try {
      // Filter out fields that don't exist in the database table
      // Only send supported fields: name, description, color
      const projectData = {
        name: data.name,
        description: data.description,
        color: data.color,
        // Note: dueDate and resources are not supported in the current database schema
      };

      // Show success animation
      setShowSuccess(true);
      
      // Call the callback after a brief delay
      setTimeout(() => {
        onCreateProject?.(projectData as CreateProjectFormData);
        onOpenChange(false);
      }, 1000);
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
      setShowSuccess(false);
    }
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
                <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
                  Create a new project to organize your tasks and resources.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 divide-y divide-muted/20">
                  {/* Basics Section */}
                  <BasicsSection control={form.control} />

                  {/* Meta Section */}
                  <MetaSection control={form.control} />

                  {/* Resources Section */}
                  <ResourcesSection control={form.control} />

                  {/* Actions */}
                  <div className="flex flex-col gap-2 pt-6 mt-6">
                    <Button
                      type="submit"
                      className="w-full py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition shadow"
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
