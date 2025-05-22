
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Command, Github, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandModal } from "@/components/modals/CommandModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/hooks/use-theme";

export default function Settings() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  
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
        
        <Tabs defaultValue="appearance" className="space-y-6">
          <TabsList className="glassmorphic">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="github">GitHub</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>
          
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Theme</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Mode</Label>
                  <RadioGroup 
                    defaultValue={theme}
                    onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="light" id="light" />
                      <Label htmlFor="light" className="flex items-center gap-1.5">
                        <Sun className="h-4 w-4" />
                        Light
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="dark" id="dark" />
                      <Label htmlFor="dark" className="flex items-center gap-1.5">
                        <Moon className="h-4 w-4" />
                        Dark
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="system" id="system" />
                      <Label htmlFor="system">System</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="grid grid-cols-5 gap-2">
                    <div className="bg-gradient-primary h-10 rounded-md cursor-pointer ring-2 ring-primary ring-offset-2 ring-offset-background"></div>
                    <div className="bg-gradient-to-r from-pink-500 to-purple-500 h-10 rounded-md cursor-pointer"></div>
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-10 rounded-md cursor-pointer"></div>
                    <div className="bg-gradient-to-r from-violet-500 to-indigo-500 h-10 rounded-md cursor-pointer"></div>
                    <div className="bg-gradient-to-r from-amber-500 to-red-500 h-10 rounded-md cursor-pointer"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="calendar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Outlook Calendar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center p-4 rounded-md bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400">
                  <div className="ml-2 text-sm">
                    Please connect your Outlook account to display calendar events.
                  </div>
                </div>
                
                <Button>Connect Outlook</Button>
                
                <div className="text-sm text-muted-foreground">
                  <p>Calendar data will be synced every 15 minutes.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="github" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  GitHub Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>
                    Connect your GitHub account to sync your prompts to a GitHub repository.
                    This feature will be available in the next version.
                  </p>
                </div>
                
                <Button variant="outline">
                  <Github className="mr-2 h-4 w-4" />
                  Connect GitHub Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-lg">C</AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-2">
                    <Button variant="outline" size="sm">
                      Change Avatar
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      JPG, GIF or PNG. 1MB max.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    placeholder="example@email.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Storage Usage</Label>
                  <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="absolute top-0 left-0 h-full w-[15%] bg-primary"></div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Using 150MB of 1GB (15%)
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-between">
              <Button variant="outline" className="text-destructive hover:text-destructive">
                Sign Out
              </Button>
              
              <Button>
                Save Changes
              </Button>
            </div>
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
