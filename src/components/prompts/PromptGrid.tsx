
import { PromptCard } from "./PromptCard";

interface Prompt {
  id: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
}

interface PromptGridProps {
  prompts: Prompt[];
  onViewPrompt: (prompt: Prompt) => void;
}

export function PromptGrid({ prompts, onViewPrompt }: PromptGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {prompts.map((prompt) => (
        <PromptCard
          key={prompt.id}
          prompt={prompt}
          onViewPrompt={onViewPrompt}
        />
      ))}
    </div>
  );
}
