
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import {
  GlassModal,
  GlassModalContent,
  GlassModalHeader,
  GlassModalTitle,
  GlassModalDescription,
} from "@/components/ui/GlassModal";
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
      const projectData = {
        name: data.name,
        description: data.description,
        color: data.color,
      };

      setShowSuccess(true);
      
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
    <GlassModal open={open} onOpenChange={onOpenChange}>
      <GlassModalContent className="max-w-lg">
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
                className="text-lg font-semibold"
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
              <GlassModalHeader>
                <GlassModalTitle>
                  New Project
                </GlassModalTitle>
                <GlassModalDescription>
                  Create a new project to organize your tasks and resources.
                </GlassModalDescription>
              </GlassModalHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 divide-y divide-muted/20">
                  <BasicsSection control={form.control} />
                  <MetaSection control={form.control} />
                  <ResourcesSection control={form.control} />

                  <div className="flex flex-col gap-2 pt-6 mt-6">
                    <Button
                      type="submit"
                      className="w-full py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition shadow"
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
      </GlassModalContent>
    </GlassModal>
  );
}
