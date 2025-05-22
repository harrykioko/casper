
import { Button } from "@/components/ui/button";
import { Command } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DashboardHeaderProps {
  openCommandModal: () => void;
}

export function DashboardHeader({ openCommandModal }: DashboardHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-800 dark:text-white/90">Dashboard</h1>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline"
              className="glassmorphic gap-2 hover:shadow-sm ring-1 ring-white/10"
              onClick={openCommandModal}
            >
              <Command className="h-4 w-4" />
              <span>Command</span>
              <kbd className="ml-2 text-xs bg-muted px-2 py-0.5 rounded">⌘K</kbd>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>⌘K — Open Command Menu</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
