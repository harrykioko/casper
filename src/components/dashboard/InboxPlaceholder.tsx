import { Inbox, Mail } from "lucide-react";
import { GlassPanel, GlassPanelHeader, GlassSubcard } from "@/components/ui/glass-panel";

export function InboxPlaceholder() {
  const placeholderItems = [
    { id: 1, text: "Inbox item placeholder 1" },
    { id: 2, text: "Inbox item placeholder 2" },
    { id: 3, text: "Inbox item placeholder 3" },
  ];

  return (
    <GlassPanel className="h-full">
      <GlassPanelHeader 
        title="Inbox" 
        action={
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Inbox className="h-4 w-4 text-primary" />
          </div>
        }
      />
      
      <div className="space-y-3">
        {placeholderItems.map((item) => (
          <GlassSubcard key={item.id} hoverable={false} className="opacity-60">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">{item.text}</span>
            </div>
          </GlassSubcard>
        ))}
      </div>
      
      <p className="mt-4 text-xs text-muted-foreground/70 text-center italic">
        Functionality will be added after UI finalization.
      </p>
    </GlassPanel>
  );
}
