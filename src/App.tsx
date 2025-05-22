
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/use-theme";

import { NavSidebar } from "@/components/layout/NavSidebar";
import { SidebarStateProvider, useSidebarState } from "@/contexts/SidebarStateContext";
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Prompts from "./pages/Prompts";
import ReadingList from "./pages/ReadingList";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <SidebarStateProvider>
            <BrowserRouter>
              <div className="min-h-screen flex">
                <NavSidebar />
                <MainContent />
              </div>
            </BrowserRouter>
          </SidebarStateProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

const MainContent = () => {
  const { expanded } = useSidebarState();
  
  return (
    <div className={`flex-1 transition-all duration-300 ${expanded ? 'ml-64' : 'ml-16'}`}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/prompts" element={<Prompts />} />
        <Route path="/reading-list" element={<ReadingList />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

export default App;
