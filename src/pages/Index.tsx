
import { useState, useEffect } from "react";
import Dashboard from "./Dashboard";

const Index = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  // Listen for sidebar expansion state changes
  useEffect(() => {
    const handleResize = () => {
      const isWide = window.innerWidth > 768;
      setSidebarExpanded(isWide);
    };

    // Set initial state
    handleResize();

    // Update on window resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`transition-all duration-300 ${sidebarExpanded ? 'pl-64' : 'pl-16'}`}>
      <Dashboard />
    </div>
  );
};

export default Index;
