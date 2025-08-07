import { Button } from "@/components/ui/button";
import { Edit3, RefreshCw, Sparkles, Copy, Save, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PromptActionsProps {
  prompt: string;
  isEditing: boolean;
  onEditStart: () => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onRegenerate: () => void;
  onSave: () => void;
}

export function PromptActions({
  prompt,
  isEditing,
  onEditStart,
  onEditSave,
  onEditCancel,
  onRegenerate,
  onSave,
}: PromptActionsProps) {
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      toast({
        title: "Copied!",
        description: "Prompt copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  if (isEditing) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={onEditSave}
          className="text-xs"
        >
          <Check className="w-3 h-3 mr-1" />
          Save Changes
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onEditCancel}
          className="text-xs"
        >
          <X className="w-3 h-3 mr-1" />
          Cancel
        </Button>
      </div>
    );
  }

  const actions = [
    { id: "edit", label: "Edit", icon: Edit3, variant: "outline" as const, onClick: onEditStart },
    { id: "regenerate", label: "Regenerate", icon: RefreshCw, variant: "outline" as const, onClick: onRegenerate },
    { id: "copy", label: "Copy", icon: Copy, variant: "secondary" as const, onClick: handleCopy },
    { id: "save", label: "Save", icon: Save, variant: "default" as const, onClick: onSave },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(({ id, label, icon: Icon, variant, onClick }) => (
        <Button
          key={id}
          variant={variant}
          size="sm"
          onClick={onClick}
          className="text-xs"
        >
          <Icon className="w-3 h-3 mr-1" />
          {label}
        </Button>
      ))}
    </div>
  );
}