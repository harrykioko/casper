import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AnimatePresence } from "framer-motion";
import { useEffect } from "react";

import { NavSidebar } from "@/components/layout/NavSidebar";
import { SidebarStateProvider, useSidebarState } from "@/contexts/SidebarStateContext";
import { FloatingNoteProvider } from "@/contexts/FloatingNoteContext";
import { GlobalInboxDrawerProvider } from "@/contexts/GlobalInboxDrawerContext";
import { GlobalInboxDrawerOverlay } from "@/components/inbox/GlobalInboxDrawerOverlay";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Prompts from "./pages/Prompts";
import ReadingList from "./pages/ReadingList";
import Pipeline from "./pages/Pipeline";
import PipelineCompanyDetail from "./pages/PipelineCompanyDetail";
import Portfolio from "./pages/Portfolio";
import PortfolioCompanyDetail from "./pages/PortfolioCompanyDetail";
import PromptBuilder from "./pages/PromptBuilder";
// Priority page removed — /priority now redirects to /focus
import Inbox from "./pages/Inbox";
import Settings from "./pages/Settings";
import Notes from "./pages/Notes";
import TriageQueue from "./pages/TriageQueue";
import ObligationsPage from "./pages/ObligationsPage";
import NotFound from "./pages/NotFound";
import OAuthCallback from "./pages/OAuthCallback";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <SidebarStateProvider>
              <FloatingNoteProvider>
                <GlobalInboxDrawerProvider>
                  <BrowserRouter>
                    <AppContent />
                    <GlobalInboxDrawerOverlay />
                  </BrowserRouter>
                </GlobalInboxDrawerProvider>
              </FloatingNoteProvider>
            </SidebarStateProvider>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

const AppContent = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const isAuthPage = location.pathname === '/auth';
  const isOAuthCallback = location.pathname === '/auth/callback/outlook';

  // Add class to body based on current route
  useEffect(() => {
    if (isLandingPage) {
      document.body.classList.add('landing-page');
    } else {
      document.body.classList.remove('landing-page');
    }
  }, [isLandingPage]);

  if (isLandingPage || isAuthPage || isOAuthCallback) {
    // Landing, Auth, and OAuth callback pages without sidebar
    return (
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback/outlook" element={<OAuthCallback />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    );
  }

  // App pages with sidebar - all protected
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex">
        <NavSidebar />
        <MainContent />
      </div>
    </ProtectedRoute>
  );
};

const MainContent = () => {
  const { expanded } = useSidebarState();
  
  return (
    <div className={`flex-1 transition-all duration-300 ${expanded ? 'ml-64' : 'ml-16'}`}>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/prompts" element={<Prompts />} />
          <Route path="/prompt-builder" element={<PromptBuilder />} />
          <Route path="/reading-list" element={<ReadingList />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/pipeline/:companyId" element={<PipelineCompanyDetail />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/portfolio/:companyId" element={<PortfolioCompanyDetail />} />
          <Route path="/priority" element={<Navigate to="/triage" replace />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/focus" element={<Navigate to="/triage" replace />} />
          <Route path="/triage" element={<TriageQueue />} />
          <Route path="/obligations" element={<ObligationsPage />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
};

export default App;
