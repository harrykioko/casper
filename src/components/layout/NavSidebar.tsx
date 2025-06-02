import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  FolderKanban, 
  MessageSquareText, 
  BookOpen,
  Settings,
  Sun,
  Moon,
  ChevronRight,
  ChevronLeft,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { useSidebarState } from "@/contexts/SidebarStateContext";
import { useAuth } from "@/contexts/AuthContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function NavSidebar() {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { expanded, toggleSidebar } = useSidebarState();
  const { signOut } = useAuth();

  const navItems = [
    { 
      icon: LayoutDashboard, 
      path: "/dashboard", 
      label: "Dashboard",
      active: location.pathname === "/dashboard" 
    },
    { 
      icon: FolderKanban, 
      path: "/projects", 
      label: "Projects",
      active: location.pathname.startsWith("/projects") 
    },
    { 
      icon: MessageSquareText, 
      path: "/prompts", 
      label: "Prompts",
      active: location.pathname.startsWith("/prompts") 
    },
    { 
      icon: BookOpen, 
      path: "/reading-list", 
      label: "Reading List",
      active: location.pathname.startsWith("/reading-list") 
    }
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div 
      className={cn(
        "fixed inset-y-0 left-0 flex flex-col items-center py-8 border-r border-white/10 transition-all duration-300 z-10 backdrop-blur-md", 
        expanded ? "w-64" : "w-16",
        theme === "dark" ? "bg-black/50" : "bg-white/60"
      )}
    >
      <div className="flex flex-col items-center gap-1 mb-8">
        {expanded ? (
          <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF6A79] to-[#415AFF]">
            Casper
          </div>
        ) : (
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-[#FF6A79] to-[#415AFF] flex items-center justify-center text-white font-bold">
            C
          </div>
        )}
      </div>
      
      <div className="flex flex-col items-center gap-4 w-full">
        {navItems.map((item) => (
          <Tooltip key={item.path} delayDuration={300}>
            <TooltipTrigger asChild>
              <Link
                to={item.path}
                className={cn(
                  "relative flex h-10 items-center rounded-md transition-colors",
                  expanded ? "w-[90%] px-4 justify-start" : "w-10 justify-center",
                  item.active 
                    ? "text-white dark:text-white/90 font-medium" 
                    : "text-zinc-700 dark:text-white/70 hover:text-[#FF6A79] dark:hover:text-[#FF6A79]"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {item.active && (
                  <span className={cn(
                    "absolute top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-[#FF6A79] to-[#415AFF] rounded-r-full",
                    expanded ? "left-0" : "-left-1"
                  )} />
                )}
                {expanded && (
                  <span className="ml-3 text-sm">{item.label}</span>
                )}
              </Link>
            </TooltipTrigger>
            {!expanded && (
              <TooltipContent side="right" className="glassmorphic">
                {item.label}
              </TooltipContent>
            )}
          </Tooltip>
        ))}
      </div>
      
      <div className="mt-auto flex flex-col items-center gap-4 mb-8 w-full">
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Link 
              to="/settings" 
              className={cn(
                "flex h-10 items-center rounded-md transition-colors",
                expanded ? "w-[90%] px-4 justify-start" : "w-10 justify-center",
                location.pathname.startsWith("/settings") 
                  ? "text-white dark:text-white/90 font-medium" 
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

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="mt-4 text-zinc-700 dark:text-white/70 hover:text-[#415AFF] dark:hover:text-[#415AFF]"
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {expanded ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}
