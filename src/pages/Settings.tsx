
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandModal } from "@/components/modals/CommandModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import tab components
import { AppearanceTab } from "@/components/settings/AppearanceTab";
import { CalendarTab } from "@/components/settings/CalendarTab";
import { GitHubTab } from "@/components/settings/GitHubTab";
import { AccountTab } from "@/components/settings/AccountTab";
import { HabitsTab } from "@/components/settings/HabitsTab";

export default function Settings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  
  // Get the tab from URL parameters, default to 'appearance'
  const defaultTab = searchParams.get('tab') || 'appearance';
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Update active tab when URL parameter changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);
  
  // Command modal handling
  const openCommandModal = () => setIsCommandModalOpen(true);
  const closeCommandModal = () => setIsCommandModalOpen(false);
  
  // Handle keyboard shortcut for command modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      openCommandModal();
    }
  };
  
  return (
    <div 
      className="p-8 pl-24 min-h-screen"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <Button 
            variant="outline"
            className="glassmorphic"
            onClick={openCommandModal}
          >
            <span className="sr-only">Command</span>
            <kbd className="text-xs bg-muted px-2 py-0.5 rounded">⌘K</kbd>
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glassmorphic">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="github">GitHub</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="habits">Habits</TabsTrigger>
          </TabsList>
          
          <TabsContent value="appearance" className="space-y-6">
            <AppearanceTab />
          </TabsContent>
          
          <TabsContent value="calendar" className="space-y-6">
            <CalendarTab />
          </TabsContent>
          
          <TabsContent value="github" className="space-y-6">
            <GitHubTab />
          </TabsContent>
          
          <TabsContent value="account" className="space-y-6">
            <AccountTab />
          </TabsContent>
          
          <TabsContent value="habits" className="space-y-6">
            <HabitsTab />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Command Modal */}
      <CommandModal 
        isOpen={isCommandModalOpen} 
        onClose={closeCommandModal}
        onNavigate={navigate}
      />
    </div>
  );
}
