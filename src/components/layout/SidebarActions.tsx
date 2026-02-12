
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Settings, Sun, Moon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/contexts/AuthContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarActionsProps {
  expanded: boolean;
}

export function SidebarActions({ expanded }: SidebarActionsProps) {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="mt-auto flex flex-col items-center gap-4 mb-8 w-full">
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Link
            to="/settings"
            className={cn(
              "flex h-10 items-center rounded-md transition-colors",
              expanded ? "w-[90%] px-4 justify-start" : "w-10 justify-center",
              location.pathname.startsWith("/settings")
                ? "text-zinc-900 dark:text-white bg-white/20 dark:bg-white/10 font-semibold shadow-sm"
                : "text-zinc-700 dark:text-white/70 hover:text-[#FF6A79] dark:hover:text-[#FF6A79]"
            )}
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            {expanded && (
              <span className="ml-3 text-sm">Settings</span>
            )}
          </Link>
        </TooltipTrigger>
        {!expanded && (
          <TooltipContent side="right" className="glassmorphic">
            Settings
          </TooltipContent>
        )}
      </Tooltip>

      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className={cn(
              "text-zinc-700 dark:text-white/70 hover:text-[#415AFF] dark:hover:text-[#415AFF]",
              expanded ? "w-[90%] justify-start px-4" : ""
            )}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5 flex-shrink-0" />
            ) : (
              <Moon className="h-5 w-5 flex-shrink-0" />
            )}
            {expanded && (
              <span className="ml-3 text-sm">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            )}
          </Button>
        </TooltipTrigger>
        {!expanded && (
          <TooltipContent side="right" className="glassmorphic">
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </TooltipContent>
        )}
      </Tooltip>

      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            aria-label="Sign out"
            className={cn(
              "text-zinc-700 dark:text-white/70 hover:text-red-500 dark:hover:text-red-400",
              expanded ? "w-[90%] justify-start px-4" : ""
            )}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {expanded && (
              <span className="ml-3 text-sm">Sign Out</span>
            )}
          </Button>
        </TooltipTrigger>
        {!expanded && (
          <TooltipContent side="right" className="glassmorphic">
            Sign Out
          </TooltipContent>
        )}
      </Tooltip>
    </div>
  );
}
