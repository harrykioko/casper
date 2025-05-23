
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PromptHeaderProps {
  onNewPrompt: () => void;
  onOpenCommand: () => void;
}

export function PromptHeader({ onNewPrompt, onOpenCommand }: PromptHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold">Prompt Library</h1>
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={onNewPrompt}
        >
          <Plus className="h-4 w-4" />
          <span>New Prompt</span>
        </Button>
        <Button 
          variant="outline"
          className="glassmorphic"
          onClick={onOpenCommand}
        >
          <span className="sr-only">Command</span>
          <kbd className="text-xs bg-muted px-2 py-0.5 rounded">⌘K</kbd>
        </Button>
      </div>
    </div>
  );
}
