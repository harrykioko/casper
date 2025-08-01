
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Settings, Sun, Moon, ChevronRight, ChevronLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/contexts/AuthContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarActionsProps {
  expanded: boolean;
  toggleSidebar: () => void;
}

export function SidebarActions({ expanded, toggleSidebar }: SidebarActionsProps) {
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
    <>
      {/* Centered Toggle Button */}
      <div className="absolute top-1/2 -translate-y-1/2 right-0 translate-x-1/2 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8 bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-full text-zinc-700 dark:text-white/70 hover:text-[#415AFF] dark:hover:text-[#415AFF] hover:bg-white/20 dark:hover:bg-white/10 transition-all shadow-lg"
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {expanded ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col items-center gap-3 w-full">
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Link 
              to="/settings" 
              className={cn(
                "flex h-10 items-center rounded-md transition-colors",
                expanded ? "w-[90%] px-4 justify-start" : "w-10 justify-center",
                location.pathname.startsWith("/settings") 
                  ? "text-zinc-900 dark:text-white font-medium bg-white/10 dark:bg-white/10" 
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
    </>
  );
}
