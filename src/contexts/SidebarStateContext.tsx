
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type SidebarStateContextType = {
  expanded: boolean;
  toggleSidebar: () => void;
};

const SidebarStateContext = createContext<SidebarStateContextType | undefined>(undefined);

export function SidebarStateProvider({ children }: { children: ReactNode }) {
  // Initialize state from localStorage if available, default to false (collapsed)
  const [expanded, setExpanded] = useState<boolean>(() => {
    const saved = localStorage.getItem('sidebar-expanded');
    return saved ? JSON.parse(saved) : false;
  });

  // Update localStorage when expanded state changes
  useEffect(() => {
    localStorage.setItem('sidebar-expanded', JSON.stringify(expanded));
  }, [expanded]);

  const toggleSidebar = () => {
    setExpanded(prev => !prev);
  };

  return (
    <SidebarStateContext.Provider value={{ expanded, toggleSidebar }}>
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
