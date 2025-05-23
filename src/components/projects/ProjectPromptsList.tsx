
import { useState } from "react";
import { MessageSquareText, Copy, Plus } from "lucide-react";
import { CardTitle, Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";

interface Prompt {
  id: string;
  title: string;
  preview: string;
}

interface ProjectPromptsListProps {
  prompts: Prompt[];
  onAddPrompt?: (prompt: { title: string; content: string }) => void;
}

const promptSchema = z.object({
  title: z.string().min(1, "Prompt title is required"),
  content: z.string().min(1, "Prompt content is required")
});

type PromptFormValues = z.infer<typeof promptSchema>;

export function ProjectPromptsList({ prompts, onAddPrompt }: ProjectPromptsListProps) {
  const [isAddPromptOpen, setIsAddPromptOpen] = useState(false);
  const { toast: uiToast } = useToast();
  
  const form = useForm<PromptFormValues>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      title: "",
      content: ""
    }
  });
  
  const handleAddPrompt = (values: PromptFormValues) => {
    if (onAddPrompt) {
      // Since values are validated by Zod, we know they exist and match the required type
      onAddPrompt({
        title: values.title,
        content: values.content
      });
    } else {
      // For demo, show a toast
      toast.success("Prompt added successfully (demo)");
    }
    form.reset();
    setIsAddPromptOpen(false);
  };
  
  const handleCopyPrompt = (promptText: string) => {
    navigator.clipboard.writeText(promptText);
    uiToast({
      title: "Copied to clipboard",
      description: "Prompt has been copied."
    });
  };

  return (
    <>
      <Card className="relative rounded-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-sm ring-1 ring-black/5 dark:ring-white/10 hover:shadow-md/10 transition hover:translate-y-[-2px] group">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <MessageSquareText className="mr-2 h-5 w-5" />
            Prompts
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition">
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1 text-xs"
                onClick={() => setIsAddPromptOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Prompt
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {prompts.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No prompts yet</p>
          ) : (
            <ul className="space-y-2">
              {prompts.map(prompt => (
                <li 
                  key={prompt.id}
                  className="p-3 rounded-md hover:bg-accent/30 transition-colors cursor-pointer flex items-start justify-between"
                >
                  <div>
                    <h4 className="font-medium text-sm">{prompt.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {prompt.preview}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 mt-1 opacity-0 group-hover:opacity-100 hover:opacity-100 transition active:scale-95"
                    onClick={() => handleCopyPrompt(prompt.preview)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      
      {/* Add Prompt Dialog */}
      <Dialog open={isAddPromptOpen} onOpenChange={setIsAddPromptOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white/10 dark:bg-zinc-900/30 backdrop-blur-sm ring-1 ring-white/10 dark:ring-white/5 shadow-2xl transition-all">
          <DialogHeader>
            <DialogTitle>Add Prompt</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddPrompt)} className="space-y-4">
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
                    <FormLabel>Content</FormLabel>
                    <Textarea 
                      {...field}
                      placeholder="Enter prompt content..."
                      className="bg-background/80 border border-muted/30 text-foreground placeholder:text-muted-foreground rounded-md focus:ring-2 focus:ring-cyan-500 transition min-h-[150px]"
                      rows={5}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddPromptOpen(false)}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="w-full py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition shadow"
                >
                  Add Prompt
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
