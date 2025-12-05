import { Command, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface DashboardHeroBandProps {
  userName?: string;
  onCommandClick: () => void;
}

export function DashboardHeroBand({ userName, onCommandClick }: DashboardHeroBandProps) {
  const firstName = userName?.split(' ')[0] || userName?.split('@')[0] || 'there';
  const today = new Date();
  
  return (
    <div className="relative w-full mb-8 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 hero-gradient" />
      
      {/* Glass overlay */}
      <div className="absolute inset-0 bg-white/30 dark:bg-black/20 backdrop-blur-sm" />
      
      {/* Content */}
      <div className="relative px-8 py-10 flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Hello, {firstName}
          </h1>
          <p className="text-muted-foreground">
            {format(today, "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        
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
