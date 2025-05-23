
import { MessageSquareText, Copy, Plus } from "lucide-react";
import { CardTitle, Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Prompt {
  id: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
}

interface ProjectPromptsListProps {
  prompts: Prompt[];
  onAddPrompt?: () => void;
}

export function ProjectPromptsList({ prompts, onAddPrompt }: ProjectPromptsListProps) {
  const { toast: uiToast } = useToast();
  
  const handleCopyPrompt = (promptText: string) => {
    navigator.clipboard.writeText(promptText);
    uiToast({
      title: "Copied to clipboard",
      description: "Prompt has been copied."
    });
  };

  return (
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
              onClick={onAddPrompt}
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
                    {prompt.description}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 mt-1 opacity-0 group-hover:opacity-100 hover:opacity-100 transition active:scale-95"
                  onClick={() => handleCopyPrompt(prompt.content)}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
