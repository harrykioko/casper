import { Command, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface DashboardHeroBandProps {
  userName?: string;
  onCommandClick: () => void;
  priorityCount: number;
  inboxCount: number;
  todoCount: number;
}

function GlassChip({ count, label }: { count: number; label: string }) {
  return (
    <div className="glass-chip">
      <span className="text-lg font-bold text-foreground min-w-[1.25rem] text-center">{count}</span>
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  );
}

export function DashboardHeroBand({ 
  userName, 
  onCommandClick,
  priorityCount,
  inboxCount,
  todoCount 
}: DashboardHeroBandProps) {
  const firstName = userName?.split(' ')[0] || userName?.split('@')[0] || 'there';
  const today = new Date();
  
  return (
    <div className="w-full mb-8 px-4 sm:px-6 lg:px-8">
      {/* Hero Container */}
      <div className="relative h-[140px] px-8 py-6 rounded-[28px] overflow-hidden shadow-[0_6px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_6px_28px_rgba(0,0,0,0.25)]">
        {/* Background gradient with radial highlight */}
        <div className="absolute inset-0 hero-container-gradient" />
        
        {/* Content: 3-column grid */}
        <div className="relative h-full grid grid-cols-[auto_1fr_auto] items-center gap-8">
          {/* LEFT: Glass stat chips (stacked vertically) */}
          <div className="flex flex-col gap-2">
            <GlassChip count={priorityCount} label="Priority" />
            <GlassChip count={inboxCount} label="Inbox" />
            <GlassChip count={todoCount} label="To-Dos" />
          </div>
          
          {/* CENTER: Greeting */}
          <div className="text-center">
            <h1 className="text-3xl font-heading font-bold text-foreground">
              Hello, {firstName}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {format(today, "EEEE, MMMM d, yyyy")}
            </p>
          </div>
          
          {/* RIGHT: Control buttons */}
          <div className="flex items-center gap-3">
            {/* Search Button - Glass pill */}
            <Button
              variant="ghost"
              size="icon"
              className="glass-control h-10 w-10"
            >
              <Search className="h-4 w-4 text-foreground" />
            </Button>
            
            {/* Command Button - Glass pill with accent ring */}
            <Button
              onClick={onCommandClick}
              variant="ghost"
              className="glass-control h-10 px-4 gap-2 ring-1 ring-primary/30 dark:ring-primary/20"
            >
              <Command className="h-4 w-4 text-primary" />
              <span className="font-medium text-primary">Command</span>
              <kbd className="ml-1 text-xs bg-primary/10 dark:bg-primary/20 px-2 py-0.5 rounded-md font-mono text-primary">
                ⌘K
              </kbd>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
