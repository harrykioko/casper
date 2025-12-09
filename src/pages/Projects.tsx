import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FolderKanban, Plus, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommandModal } from "@/components/modals/CommandModal";
import { CreateProjectModal } from "@/components/modals/CreateProjectModal";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/hooks/useProjects";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  PROJECT_TYPES, 
  PROJECT_STATUSES, 
  PROJECT_STATUS_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  ProjectStatus, 
  ProjectType 
} from "@/lib/constants/projectTypes";

interface ProjectWithCounts {
  id: string;
  name: string;
  description: string;
  color: string;
  type: ProjectType;
  status: ProjectStatus;
  is_pinned: boolean;
  taskCount: number;
  completedTaskCount: number;
  promptCount: number;
}

export default function Projects() {
  const navigate = useNavigate();
  const { projects, loading, createProject } = useProjects();
  const { toast } = useToast();
  const [projectsWithCounts, setProjectsWithCounts] = useState<ProjectWithCounts[]>([]);
  const [countsLoading, setCountsLoading] = useState(true);
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ProjectType | 'all'>('all');

  // Fetch task and prompt counts for each project
  useEffect(() => {
    const fetchProjectCounts = async () => {
      if (projects.length === 0) {
        setCountsLoading(false);
        return;
      }

      try {
        setCountsLoading(true);
        
        const projectIds = projects.map(p => p.id);
        
        // Fetch task counts
        const { data: taskCounts, error: taskError } = await supabase
          .from('tasks')
          .select('project_id, completed')
          .in('project_id', projectIds);

        if (taskError) throw taskError;

        // Fetch prompt counts
        const { data: promptCounts, error: promptError } = await supabase
          .from('prompts')
          .select('project_id')
          .in('project_id', projectIds);

        if (promptError) throw promptError;

        // Process counts
        const countsMap = new Map<string, { taskCount: number; completedTaskCount: number; promptCount: number }>();
        
        // Initialize counts
        projectIds.forEach(id => {
          countsMap.set(id, { taskCount: 0, completedTaskCount: 0, promptCount: 0 });
        });

        // Count tasks
        taskCounts?.forEach(task => {
          if (task.project_id) {
            const counts = countsMap.get(task.project_id);
            if (counts) {
              counts.taskCount++;
              if (task.completed) {
                counts.completedTaskCount++;
              }
            }
          }
        });

        // Count prompts
        promptCounts?.forEach(prompt => {
          if (prompt.project_id) {
            const counts = countsMap.get(prompt.project_id);
            if (counts) {
              counts.promptCount++;
            }
          }
        });

        // Combine with project data
        const projectsWithCounts = projects.map(project => ({
          id: project.id,
          name: project.name,
          description: project.description || "",
          color: project.color || "#FF1464",
          type: (project.type as ProjectType) || 'other',
          status: (project.status as ProjectStatus) || 'active',
          is_pinned: project.is_pinned || false,
          taskCount: countsMap.get(project.id)?.taskCount || 0,
          completedTaskCount: countsMap.get(project.id)?.completedTaskCount || 0,
          promptCount: countsMap.get(project.id)?.promptCount || 0
        }));

        setProjectsWithCounts(projectsWithCounts);
      } catch (error) {
        console.error('Error fetching project counts:', error);
        toast({
          title: "Error",
          description: "Failed to load project statistics",
          variant: "destructive"
        });
      } finally {
        setCountsLoading(false);
      }
    };

    fetchProjectCounts();
  }, [projects, toast]);
  
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

  // Filter projects
  const filteredProjects = projectsWithCounts
    .filter(p => statusFilter === 'all' || p.status === statusFilter)
    .filter(p => typeFilter === 'all' || p.type === typeFilter)
    .sort((a, b) => {
      // Pinned projects first
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return 0;
    });

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
        <div className="flex justify-between items-center mb-6">
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

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {/* Status filters */}
          <Button
            size="sm"
            variant={statusFilter === 'all' ? 'secondary' : 'ghost'}
            className="h-7 text-xs"
            onClick={() => setStatusFilter('all')}
          >
            All Statuses
          </Button>
          {PROJECT_STATUS_OPTIONS.map(status => (
            <Button
              key={status.value}
              size="sm"
              variant={statusFilter === status.value ? 'secondary' : 'ghost'}
              className={cn("h-7 text-xs gap-1", statusFilter === status.value && status.bgColor)}
              onClick={() => setStatusFilter(status.value as ProjectStatus)}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full", status.dotColor)} />
              {status.label}
            </Button>
          ))}

          <div className="w-px h-6 bg-border mx-1" />

          {/* Type filters */}
          <Button
            size="sm"
            variant={typeFilter === 'all' ? 'secondary' : 'ghost'}
            className="h-7 text-xs"
            onClick={() => setTypeFilter('all')}
          >
            All Types
          </Button>
          {PROJECT_TYPE_OPTIONS.map(type => {
            const TypeIcon = type.icon;
            return (
              <Button
                key={type.value}
                size="sm"
                variant={typeFilter === type.value ? 'secondary' : 'ghost'}
                className={cn("h-7 text-xs gap-1", typeFilter === type.value && type.bgColor)}
                onClick={() => setTypeFilter(type.value as ProjectType)}
              >
                <TypeIcon className="w-3 h-3" />
                {type.label.split(' / ')[0]}
              </Button>
            );
          })}
        </div>
        
        <div className="grid auto-rows-[11rem] grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-6">
          {filteredProjects.map((project) => {
            const progressPercentage = project.taskCount > 0 
              ? (project.completedTaskCount / project.taskCount) * 100 
              : 0;
            const typeConfig = PROJECT_TYPES[project.type] || PROJECT_TYPES.other;
            const statusConfig = PROJECT_STATUSES[project.status] || PROJECT_STATUSES.active;
            const TypeIcon = typeConfig.icon;
            
            return (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-500"
              >
                <Card
                  className="relative rounded-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-sm ring-1 ring-black/5 dark:ring-white/10 transition-shadow duration-200 hover:shadow-lg/20 hover:scale-[1.01] h-full"
                  style={{ '--accentColor': project.color } as React.CSSProperties}
                >
                  <div className="absolute left-0 top-3 bottom-3 w-1 rounded-l-2xl bg-[var(--accentColor)]"></div>
                  {project.is_pinned && (
                    <div className="absolute top-2 right-2">
                      <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    </div>
                  )}
                  <CardHeader className="pb-1">
                    <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 text-base">
                      {project.name}
                    </CardTitle>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge variant="secondary" className={cn("text-[10px] h-5 gap-1 px-1.5", typeConfig.bgColor, typeConfig.color)}>
                        <TypeIcon className="w-2.5 h-2.5" />
                        {typeConfig.label.split(' / ')[0]}
                      </Badge>
                      <Badge variant="secondary" className={cn("text-[10px] h-5 gap-1 px-1.5", statusConfig.bgColor, statusConfig.color)}>
                        <span className={cn("w-1 h-1 rounded-full", statusConfig.dotColor)} />
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {project.description || 'No description'}
                    </p>
                    
                    {countsLoading ? (
                      <Skeleton className="h-1.5 w-full mb-2" />
                    ) : (
                      <Progress 
                        value={progressPercentage} 
                        className="h-1 rounded-full bg-muted dark:bg-muted/30 mb-2" 
                      />
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <FolderKanban className="h-3.5 w-3.5 mr-1" />
                        <span>{countsLoading ? '...' : `${project.taskCount} tasks`}</span>
                      </div>
                      {project.promptCount > 0 && (
                        <span>{project.promptCount} prompts</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
          
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

        {filteredProjects.length === 0 && projectsWithCounts.length > 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FolderKanban className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-lg font-medium">No matching projects</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        )}

        {projectsWithCounts.length === 0 && !loading && (
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
