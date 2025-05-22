
import { Button } from "@/components/ui/button";
import { Command } from "lucide-react";

interface DashboardHeaderProps {
  openCommandModal: () => void;
}

export function DashboardHeader({ openCommandModal }: DashboardHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-800 dark:text-white/90">Dashboard</h1>
      <Button 
        variant="outline"
        className="glassmorphic gap-2"
        onClick={openCommandModal}
      >
        <Command className="h-4 w-4" />
        <span>Command</span>
        <kbd className="ml-2 text-xs bg-muted px-2 py-0.5 rounded">⌘K</kbd>
      </Button>
    </div>
  );
}
