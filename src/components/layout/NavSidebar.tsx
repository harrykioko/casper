
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  LayoutDashboard,
  Crosshair,
  Inbox,
  List,
  FolderKanban,
  Handshake,
  MessageSquareText,
  BookOpen,
  TrendingUp,
  Briefcase,
  StickyNote,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useSidebarState } from "@/contexts/SidebarStateContext";
import { NavItem } from "./NavItem";
import { NavSection } from "./NavSection";
import { NavGroupFlyout } from "./NavGroupFlyout";
import { SidebarBrand } from "./SidebarBrand";
import { SidebarActions } from "./SidebarActions";
import { Separator } from "@/components/ui/separator";

export function NavSidebar() {
  const location = useLocation();
  const { theme } = useTheme();
  const { expanded, toggleSidebar, sectionStates, toggleSection } = useSidebarState();

  const homeItem = {
    icon: Home,
    path: "/home",
    label: "Home",
    active: location.pathname === "/home"
  };

  const workspaceItems = [
    {
      icon: LayoutDashboard,
      path: "/dashboard",
      label: "Dashboard",
      active: location.pathname === "/dashboard"
    },
    {
      icon: Crosshair,
      path: "/triage",
      label: "Triage",
      active: location.pathname.startsWith("/triage") || location.pathname.startsWith("/focus") || location.pathname.startsWith("/priority")
    },
    {
      icon: Inbox,
      path: "/inbox",
      label: "Inbox",
      active: location.pathname.startsWith("/inbox")
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
    },
    {
      icon: Handshake,
      path: "/obligations",
      label: "Obligations",
      active: location.pathname.startsWith("/obligations")
    }
  ];

  const investmentItems = [
    {
      icon: TrendingUp,
      path: "/pipeline",
      label: "Pipeline",
      active: location.pathname.startsWith("/pipeline")
    },
    {
      icon: Briefcase,
      path: "/portfolio",
      label: "Portfolio",
      active: location.pathname.startsWith("/portfolio")
    }
  ];

  const knowledgeItems = [
    {
      icon: StickyNote,
      path: "/notes",
      label: "Notes",
      active: location.pathname.startsWith("/notes")
    },
    {
      icon: MessageSquareText,
      path: "/prompts",
      label: "Prompts",
      active: location.pathname.startsWith("/prompts") || location.pathname.startsWith("/prompt-builder")
    },
    {
      icon: BookOpen,
      path: "/reading-list",
      label: "Reading List",
      active: location.pathname.startsWith("/reading-list")
    }
  ];

  const groups = [
    { id: "workspace" as const, title: "Workspace", items: workspaceItems },
    { id: "investments" as const, title: "Investments", items: investmentItems },
    { id: "knowledge" as const, title: "Knowledge", items: knowledgeItems },
  ];

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 flex flex-col items-center py-8 border-r border-white/10 transition-all duration-300 z-10 backdrop-blur-md",
        expanded ? "w-64" : "w-16",
        theme === "dark" ? "bg-black/50" : "bg-white/60"
      )}
    >
      {/* Edge toggle button — near top on the right border */}
      <button
        onClick={toggleSidebar}
        aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        className={cn(
          "absolute top-10 -right-3 z-20",
          "flex h-6 w-6 items-center justify-center rounded-full",
          "border border-white/15 shadow-sm",
          "text-zinc-500 dark:text-white/60",
          "hover:text-[#415AFF] dark:hover:text-[#415AFF]",
          "transition-colors duration-150",
          theme === "dark"
            ? "bg-zinc-900/90 hover:bg-zinc-800/90"
            : "bg-white/90 hover:bg-white"
        )}
      >
        {expanded ? (
          <ChevronLeft className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </button>

      <SidebarBrand expanded={expanded} />

      <div className="flex flex-col w-full flex-1 gap-4 px-2 overflow-y-auto scrollbar-none">
        {/* Home — standalone */}
        <NavSection expanded={expanded}>
          <NavItem
            icon={homeItem.icon}
            path={homeItem.path}
            label={homeItem.label}
            active={homeItem.active}
            expanded={expanded}
          />
        </NavSection>

        <Separator className="bg-white/10" />

        {/* Collapsible groups */}
        {groups.map((group, idx) => (
          <div key={group.id}>
            {expanded ? (
              <NavSection
                title={group.title}
                expanded={expanded}
                isOpen={sectionStates[group.id]}
                onToggle={() => toggleSection(group.id)}
              >
                {group.items.map((item) => (
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
            ) : (
              <NavGroupFlyout title={group.title} items={group.items} />
            )}
            {/* Thin separator between groups in collapsed mode, but not after the last */}
            {!expanded && idx < groups.length - 1 && (
              <div className="h-px bg-white/10 my-2 mx-1" />
            )}
          </div>
        ))}
      </div>

      <SidebarActions expanded={expanded} />
    </div>
  );
}
