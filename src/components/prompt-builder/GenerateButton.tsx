import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface GenerateButtonProps {
  onGenerate: () => void;
  disabled?: boolean;
}

export function GenerateButton({ onGenerate, disabled }: GenerateButtonProps) {
  return (
    <div className="flex justify-center pt-4">
      <Button
        onClick={onGenerate}
        disabled={disabled}
        size="lg"
        className="px-8 py-3 text-base font-medium bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-200"
      >
        <Sparkles className="w-5 h-5 mr-2" />
        Generate Prompt
      </Button>
    </div>
  );
}