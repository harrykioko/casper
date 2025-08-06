
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  List,
  FolderKanban, 
  MessageSquareText, 
  Sparkles,
  BookOpen,
  TrendingUp
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useSidebarState } from "@/contexts/SidebarStateContext";
import { NavItem } from "./NavItem";
import { NavSection } from "./NavSection";
import { SidebarBrand } from "./SidebarBrand";
import { SidebarActions } from "./SidebarActions";
import { Separator } from "@/components/ui/separator";

export function NavSidebar() {
  const location = useLocation();
  const { theme } = useTheme();
  const { expanded, toggleSidebar } = useSidebarState();

  const workspaceItems = [
    { 
      icon: LayoutDashboard, 
      path: "/dashboard", 
      label: "Dashboard",
      active: location.pathname === "/dashboard" 
    },
    { 
      icon: List, 
      path: "/tasks", 
      label: "Tasks",
      active: location.pathname.startsWith("/tasks") 
    },
    { 
      icon: FolderKanban, 
      path: "/projects", 
      label: "Projects",
      active: location.pathname.startsWith("/projects") 
    }
  ];

  const knowledgeToolsItems = [
    { 
      icon: MessageSquareText, 
      path: "/prompts", 
      label: "Prompts",
      active: location.pathname.startsWith("/prompts") 
    },
    { 
      icon: Sparkles, 
      path: "/prompt-builder", 
      label: "Prompt Builder",
      active: location.pathname.startsWith("/prompt-builder") 
    },
    { 
      icon: BookOpen, 
      path: "/reading-list", 
      label: "Reading List",
      active: location.pathname.startsWith("/reading-list") 
    },
    { 
      icon: TrendingUp, 
      path: "/pipeline", 
      label: "Pipeline",
      active: location.pathname.startsWith("/pipeline") 
    }
  ];

  return (
    <div 
      className={cn(
        "fixed inset-y-0 left-0 flex flex-col items-center py-8 border-r border-white/10 transition-all duration-300 z-10 backdrop-blur-md", 
        expanded ? "w-64" : "w-16",
        theme === "dark" ? "bg-black/50" : "bg-white/60"
      )}
    >
      <SidebarBrand expanded={expanded} />
      
      <div className="flex flex-col w-full flex-1 gap-6 px-2">
        {/* Workspace Section */}
        <NavSection title="Workspace" expanded={expanded}>
          {workspaceItems.map((item) => (
            <NavItem
              key={item.path}
              icon={item.icon}
              path={item.path}
              label={item.label}
              active={item.active}
              expanded={expanded}
            />
          ))}
        </NavSection>

        <Separator className="bg-white/10" />

        {/* Knowledge & Tools Section */}
        <NavSection title="Knowledge & Tools" expanded={expanded}>
          {knowledgeToolsItems.map((item) => (
            <NavItem
              key={item.path}
              icon={item.icon}
              path={item.path}
              label={item.label}
              active={item.active}
              expanded={expanded}
            />
          ))}
        </NavSection>
      </div>
      
      <SidebarActions expanded={expanded} toggleSidebar={toggleSidebar} />
    </div>
  );
}
