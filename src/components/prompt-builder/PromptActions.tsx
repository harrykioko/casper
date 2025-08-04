import { Button } from "@/components/ui/button";
import { Edit3, RefreshCw, Sparkles, Copy, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function PromptActions() {
  const { toast } = useToast();

  const handleAction = (action: string) => {
    console.log(`Action clicked: ${action}`);
    toast({
      title: "Action Triggered",
      description: `${action} functionality will be implemented in a future update.`,
    });
  };

  const actions = [
    { id: "edit", label: "Edit", icon: Edit3, variant: "outline" as const },
    { id: "regenerate", label: "Regenerate", icon: RefreshCw, variant: "outline" as const },
    { id: "improve", label: "Improve", icon: Sparkles, variant: "outline" as const },
    { id: "copy", label: "Copy", icon: Copy, variant: "secondary" as const },
    { id: "save", label: "Save", icon: Save, variant: "default" as const },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(({ id, label, icon: Icon, variant }) => (
        <Button
          key={id}
          variant={variant}
          size="sm"
          onClick={() => handleAction(label)}
          className="text-xs"
        >
          <Icon className="w-3 h-3 mr-1" />
          {label}
        </Button>
      ))}
    </div>
  );
}