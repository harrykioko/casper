import { Sparkles, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { GlassModuleCard } from "./GlassModuleCard";
import { ProjectEmptyState } from "./ProjectEmptyState";
import { cn } from "@/lib/utils";

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
    <GlassModuleCard
      icon={<Sparkles className="w-4 h-4" />}
      title="Prompts"
      count={prompts.length}
      onAdd={onAddPrompt}
      addLabel="Add Prompt"
      accentColor="#ec4899"
    >
      {prompts.length === 0 ? (
        <ProjectEmptyState
          icon={<Sparkles className="w-7 h-7" />}
          title="No prompts yet"
          description="Create reusable AI prompts for this project."
          actionLabel="Add Prompt"
          onAction={onAddPrompt}
        />
      ) : (
        <ul className="space-y-1.5">
          {prompts.map(prompt => (
            <li 
              key={prompt.id}
              className={cn(
                "p-3 rounded-xl transition-all duration-200 cursor-pointer",
                "bg-white/30 dark:bg-white/[0.03]",
                "border border-white/20 dark:border-white/[0.06]",
                "hover:bg-white/50 dark:hover:bg-white/[0.06]",
                "hover:translate-y-[-1px] hover:shadow-sm",
                "flex items-start justify-between gap-3 group/prompt"
              )}
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-foreground">{prompt.title}</h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {prompt.description}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 opacity-0 group-hover/prompt:opacity-100 transition-all active:scale-95 text-muted-foreground hover:text-primary hover:bg-primary/10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyPrompt(prompt.content);
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </GlassModuleCard>
  );
}
