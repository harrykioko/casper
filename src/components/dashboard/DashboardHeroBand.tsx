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

function StatBadge({ count, label }: { count: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-lg font-semibold text-foreground min-w-[1.5rem]">{count}</span>
      <span className="text-muted-foreground text-xs uppercase tracking-wide">{label}</span>
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
    <div className="relative w-full mb-8 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 hero-gradient" />
      
      {/* Subtle glass overlay - reduced opacity to let gradient shine */}
      <div className="absolute inset-0 bg-white/15 dark:bg-black/10 backdrop-blur-[2px]" />
      
      {/* Content - 3 column grid */}
      <div className="relative px-8 py-8 grid grid-cols-[auto_1fr_auto] items-center gap-8">
        {/* LEFT: Vertically Stacked Stats */}
        <div className="flex flex-col gap-1.5">
          <StatBadge count={priorityCount} label="Priority" />
          <StatBadge count={inboxCount} label="Inbox" />
          <StatBadge count={todoCount} label="To-Dos" />
        </div>
        
        {/* CENTER: Greeting (centered) */}
        <div className="text-center">
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Hello, {firstName}
          </h1>
          <p className="text-muted-foreground">
            {format(today, "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        
        {/* RIGHT: Command Buttons */}
        <div className="flex items-center gap-3">
          {/* Search Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full bg-white/50 dark:bg-white/10 backdrop-blur-lg border border-white/30 dark:border-white/10 hover:bg-white/70 dark:hover:bg-white/20 transition-all"
          >
            <Search className="h-4 w-4 text-foreground" />
          </Button>
          
          {/* Command Button */}
          <Button
            onClick={onCommandClick}
            className="h-10 px-4 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur-lg border border-white/30 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/20 text-foreground shadow-glass-light dark:shadow-glass-dark transition-all gap-2"
            variant="ghost"
          >
            <Command className="h-4 w-4" />
            <span className="font-medium">Command</span>
            <kbd className="ml-1 text-xs bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-md font-mono">
              ⌘K
            </kbd>
          </Button>
        </div>
      </div>
      
      {/* Bottom shadow/separator */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  );
}
