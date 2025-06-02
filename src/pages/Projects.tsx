
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FolderKanban, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommandModal } from "@/components/modals/CommandModal";
import { CreateProjectModal } from "@/components/modals/CreateProjectModal";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/hooks/useProjects";
import { useToast } from "@/hooks/use-toast";

export default function Projects() {
  const navigate = useNavigate();
  const { projects, loading, createProject } = useProjects();
  const { toast } = useToast();
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  
  // Command modal handling
  const openCommandModal = () => setIsCommandModalOpen(true);
  const closeCommandModal = () => setIsCommandModalOpen(false);
  
  // Create project modal handling
  const openCreateProjectModal = () => setIsCreateProjectModalOpen(true);
  const closeCreateProjectModal = () => setIsCreateProjectModalOpen(false);
  
  // Handle keyboard shortcut for command modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      openCommandModal();
    }
  };

  // Handle project creation
  const handleCreateProject = async (data: any) => {
    try {
      console.log('Creating project with data:', data);
      await createProject(data);
      closeCreateProjectModal();
      toast({
        title: "Success",
        description: "Project created successfully!",
      });
    } catch (error) {
      console.error('Failed to create project:', error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-8 pl-24 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-9 w-32" />
            <div className="flex gap-3">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-16" />
            </div>
          </div>
          <div className="grid auto-rows-[10rem] grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="p-8 pl-24 min-h-screen"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Projects</h1>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={openCreateProjectModal}
            >
              <Plus className="h-4 w-4" />
              <span>New Project</span>
            </Button>
            <Button 
              variant="outline"
              className="glassmorphic"
              onClick={openCommandModal}
            >
              <span className="sr-only">Command</span>
              <kbd className="text-xs bg-muted px-2 py-0.5 rounded">⌘K</kbd>
            </Button>
          </div>
        </div>
        
        <div className="grid auto-rows-[10rem] grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-6">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-500"
            >
              <Card
                className="relative rounded-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-sm ring-1 ring-black/5 dark:ring-white/10 transition-shadow duration-200 hover:shadow-lg/20 hover:scale-[1.01] h-full"
                style={{ '--accentColor': project.color || '#FF1464' } as React.CSSProperties}
              >
                <div className="absolute left-0 top-3 bottom-3 w-1 rounded-l-2xl bg-[var(--accentColor)]"></div>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                    {project.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {project.description || 'No description'}
                  </p>
                  <Progress 
                    value={0} 
                    className="h-1.5 rounded-full bg-muted dark:bg-muted/30" 
                  />
                  <div className="flex items-center text-sm mt-3 text-muted-foreground">
                    <FolderKanban className="h-4 w-4 mr-1.5" />
                    <span>0 tasks</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          
          {/* New Project Card */}
          <div 
            className="flex items-center justify-center rounded-2xl border border-dashed border-muted/40 text-muted-foreground hover:bg-white/50 dark:hover:bg-zinc-800/50 hover:shadow-lg transition cursor-pointer hover:scale-[1.01]"
            onClick={openCreateProjectModal}
          >
            <div className="flex flex-col items-center gap-2">
              <Plus className="h-6 w-6" />
              <span className="text-lg font-semibold">New Project</span>
            </div>
          </div>
        </div>

        {projects.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FolderKanban className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-lg font-medium">No projects yet</p>
            <p className="text-sm">Create your first project to get started</p>
          </div>
        )}
      </div>
      
      {/* Command Modal */}
      <CommandModal 
        isOpen={isCommandModalOpen} 
        onClose={closeCommandModal}
        onNavigate={navigate}
        onAddProject={openCreateProjectModal}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        open={isCreateProjectModalOpen}
        onOpenChange={setIsCreateProjectModalOpen}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
}
