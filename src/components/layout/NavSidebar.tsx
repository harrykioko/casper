
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  FolderKanban, 
  MessageSquareText, 
  BookOpen,
  Settings,
  Sun,
  Moon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

export function NavSidebar() {
  const location = useLocation();
  const { theme, setTheme } = useTheme();

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

  return (
    <div className="fixed inset-y-0 left-0 w-16 bg-sidebar flex flex-col items-center py-8 border-r border-border">
      <div className="flex flex-col items-center gap-1 mb-8">
        <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold">
          C
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-4">
        {navItems.map((item, i) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "relative flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-accent",
              item.active && "bg-accent text-accent-foreground"
            )}
            title={item.label}
          >
            <item.icon className="h-5 w-5" />
            {item.active && (
              <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
            )}
          </Link>
        ))}
      </div>
      
      <div className="mt-auto flex flex-col items-center gap-4 mb-8">
        <Link 
          to="/settings" 
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-accent",
            location.pathname.startsWith("/settings") && "bg-accent text-accent-foreground"
          )}
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}
