
import { useState } from "react";
import { MessageSquareText, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

interface Prompt {
  id: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
}

interface CreatePromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreatePrompt: (prompt: Omit<Prompt, 'id'>) => void;
}

const promptSchema = z.object({
  title: z.string().min(1, "Prompt title is required"),
  description: z.string().min(1, "Short description is required"),
  content: z.string().min(1, "Prompt body is required"),
  tags: z.array(z.string()).default([])
});

type PromptFormValues = z.infer<typeof promptSchema>;

export function CreatePromptModal({ open, onOpenChange, onCreatePrompt }: CreatePromptModalProps) {
  const [newTag, setNewTag] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PromptFormValues>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      title: "",
      description: "",
      content: "",
      tags: []
    }
  });

  const watchedTags = form.watch("tags");

  const addTag = () => {
    if (newTag.trim() && !watchedTags.includes(newTag.trim())) {
      form.setValue("tags", [...watchedTags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    form.setValue("tags", watchedTags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const resetForm = () => {
    form.reset();
    setNewTag("");
    setIsLoading(false);
  };

  const handleSubmit = async (values: PromptFormValues) => {
    try {
      setIsLoading(true);
      
      onCreatePrompt({
        title: values.title,
        description: values.description,
        content: values.content,
        tags: values.tags
      });
      
      toast.success("Prompt created successfully");
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error creating prompt:", error);
      toast.error("Failed to create prompt. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl bg-white/10 dark:bg-zinc-900/30 backdrop-blur-sm ring-1 ring-white/10 dark:ring-white/5 shadow-2xl transition-all">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquareText className="h-4 w-4" /> Create New Prompt
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prompt Title</FormLabel>
                  <Input 
                    {...field}
                    placeholder="Enter prompt title" 
                    autoFocus
                    className="bg-background/80 border border-muted/30 text-foreground placeholder:text-muted-foreground rounded-md focus:ring-2 focus:ring-cyan-500 transition"
                    disabled={isLoading}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Description</FormLabel>
                  <Textarea 
                    {...field}
                    placeholder="Brief description of the prompt's purpose..."
                    className="bg-background/80 border border-muted/30 text-foreground placeholder:text-muted-foreground rounded-md focus:ring-2 focus:ring-cyan-500 transition min-h-[80px]"
                    rows={3}
                    disabled={isLoading}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prompt Body</FormLabel>
                  <Textarea 
                    {...field}
                    placeholder="Enter your full prompt content (markdown supported)..."
                    className="bg-background/80 border border-muted/30 text-foreground placeholder:text-muted-foreground rounded-md focus:ring-2 focus:ring-cyan-500 transition min-h-[150px]"
                    rows={6}
                    disabled={isLoading}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
              <FormLabel>Tags</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="bg-background/80 border border-muted/30 text-foreground placeholder:text-muted-foreground rounded-md focus:ring-2 focus:ring-cyan-500 transition"
                  disabled={isLoading}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addTag}
                  disabled={!newTag.trim() || isLoading}
                >
                  Add
                </Button>
              </div>
              
              {watchedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {watchedTags.map(tag => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      onClick={() => removeTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition shadow"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Prompt"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
