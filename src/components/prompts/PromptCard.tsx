
import { MessageSquareText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Prompt {
  id: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
}

interface PromptCardProps {
  prompt: Prompt;
  onViewPrompt: (prompt: Prompt) => void;
}

export function PromptCard({ prompt, onViewPrompt }: PromptCardProps) {
  return (
    <Card
      className="hover:glassmorphic transition-all duration-150 ease-in-out cursor-pointer overflow-hidden hover:shadow-lg hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-500"
      onClick={() => onViewPrompt(prompt)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onViewPrompt(prompt);
        }
      }}
    >
      <div className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquareText className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
          <h3 className="font-medium">{prompt.title}</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {prompt.description}
        </p>
        <div className="flex flex-wrap gap-2">
          {prompt.tags.map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  );
}
