
import { useState } from "react";
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
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

export function NavSidebar() {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const navItems = [
    { 
      icon: LayoutDashboard, 
      path: "/", 
      label: "Dashboard",
      active: location.pathname === "/" 
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

  const toggleSidebar = () => {
    setExpanded(!expanded);
  };

  return (
    <div 
      className={cn(
        "fixed inset-y-0 left-0 bg-sidebar flex flex-col items-center py-8 border-r border-border transition-all duration-300", 
        expanded ? "w-64" : "w-16"
      )}
    >
      <div className="flex flex-col items-center gap-1 mb-8">
        <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold">
          C
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-4 w-full">
        {navItems.map((item, i) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "relative flex h-10 items-center rounded-md transition-colors hover:bg-accent",
              expanded ? "w-[90%] px-4 justify-start" : "w-10 justify-center",
              item.active && "bg-accent text-accent-foreground"
            )}
            title={!expanded ? item.label : undefined}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {item.active && (
              <span className={cn(
                "absolute top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full",
                expanded ? "left-0" : "-left-1"
              )} />
            )}
            {expanded && (
              <span className="ml-3 text-sm">{item.label}</span>
            )}
          </Link>
        ))}
      </div>
      
      <div className="mt-auto flex flex-col items-center gap-4 mb-8 w-full">
        <Link 
          to="/settings" 
          className={cn(
            "flex h-10 items-center rounded-md transition-colors hover:bg-accent",
            expanded ? "w-[90%] px-4 justify-start" : "w-10 justify-center",
            location.pathname.startsWith("/settings") && "bg-accent text-accent-foreground"
          )}
          title={!expanded ? "Settings" : undefined}
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          {expanded && (
            <span className="ml-3 text-sm">Settings</span>
          )}
        </Link>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
          className={expanded ? "w-[90%] justify-start px-4" : ""}
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

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="mt-4"
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
