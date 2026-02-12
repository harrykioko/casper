
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export type SectionId = "workspace" | "investments" | "knowledge";
export type SectionStates = Record<SectionId, boolean>;

const DEFAULT_SECTION_STATES: SectionStates = {
  workspace: true,
  investments: true,
  knowledge: true,
};

type SidebarStateContextType = {
  expanded: boolean;
  toggleSidebar: () => void;
  sectionStates: SectionStates;
  toggleSection: (id: SectionId) => void;
};

const SidebarStateContext = createContext<SidebarStateContextType | undefined>(undefined);

function loadSectionStates(): SectionStates {
  try {
    const saved = localStorage.getItem("sidebar-sections");
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_SECTION_STATES, ...parsed };
    }
  } catch {
    // ignore parse errors
  }
  return { ...DEFAULT_SECTION_STATES };
}

export function SidebarStateProvider({ children }: { children: ReactNode }) {
  // Initialize state from localStorage if available, default to false (collapsed)
  const [expanded, setExpanded] = useState<boolean>(() => {
    const saved = localStorage.getItem('sidebar-expanded');
    return saved ? JSON.parse(saved) : false;
  });

  const [sectionStates, setSectionStates] = useState<SectionStates>(loadSectionStates);

  // Update localStorage when expanded state changes
  useEffect(() => {
    localStorage.setItem('sidebar-expanded', JSON.stringify(expanded));
  }, [expanded]);

  useEffect(() => {
    localStorage.setItem("sidebar-sections", JSON.stringify(sectionStates));
  }, [sectionStates]);

  const toggleSidebar = () => {
    setExpanded(prev => !prev);
  };

  const toggleSection = useCallback((id: SectionId) => {
    setSectionStates(prev => {
      const next = { ...prev, [id]: !prev[id] };
      return next;
    });
  }, []);

  return (
    <SidebarStateContext.Provider value={{ expanded, toggleSidebar, sectionStates, toggleSection }}>
      {children}
    </SidebarStateContext.Provider>
  );
}

export function useSidebarState() {
  const context = useContext(SidebarStateContext);
  if (context === undefined) {
    throw new Error("useSidebarState must be used within a SidebarStateProvider");
  }
  return context;
}
