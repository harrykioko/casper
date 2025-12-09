import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FolderKanban, Plus, Search, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CommandModal } from "@/components/modals/CommandModal";
import { CreateProjectModal } from "@/components/modals/CreateProjectModal";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/hooks/useProjects";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { 
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
  notesCount: number;
  lastUpdated: string;
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
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch task, prompt, and notes counts for each project
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

        // Fetch notes counts
        const { data: notesCounts, error: notesError } = await supabase
          .from('project_notes')
          .select('project_id')
          .in('project_id', projectIds);

        if (notesError) throw notesError;

        // Process counts
        const countsMap = new Map<string, { taskCount: number; completedTaskCount: number; promptCount: number; notesCount: number }>();
        
        // Initialize counts
        projectIds.forEach(id => {
          countsMap.set(id, { taskCount: 0, completedTaskCount: 0, promptCount: 0, notesCount: 0 });
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

        // Count notes
        notesCounts?.forEach(note => {
          if (note.project_id) {
            const counts = countsMap.get(note.project_id);
            if (counts) {
              counts.notesCount++;
            }
          }
        });

        // Combine with project data
        const projectsWithCounts = projects.map(project => ({
          id: project.id,
          name: project.name,
          description: project.description || "",
          color: project.color || "#6366f1",
          type: (project.type as ProjectType) || 'other',
          status: (project.status as ProjectStatus) || 'active',
          is_pinned: project.is_pinned || false,
          taskCount: countsMap.get(project.id)?.taskCount || 0,
          completedTaskCount: countsMap.get(project.id)?.completedTaskCount || 0,
          promptCount: countsMap.get(project.id)?.promptCount || 0,
          notesCount: countsMap.get(project.id)?.notesCount || 0,
          lastUpdated: project.updated_at || project.created_at,
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
    .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()))
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
          <div className="grid auto-rows-[12rem] grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
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
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <div className="flex items-center gap-3">
            <Button 
              variant="default" 
              className={cn(
                "gap-2 h-9 px-4 rounded-xl",
                "bg-primary hover:bg-primary/90",
                "shadow-lg shadow-primary/20"
              )}
              onClick={openCreateProjectModal}
            >
              <Plus className="h-4 w-4" />
              <span>New Project</span>
            </Button>
            <Button 
              variant="outline"
              size="icon"
              className={cn(
                "h-9 w-9 rounded-xl",
                "bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md",
                "border-white/30 dark:border-white/10",
                "hover:bg-white/80 dark:hover:bg-zinc-800/80"
              )}
              onClick={openCommandModal}
            >
              <kbd className="text-[10px] font-medium">⌘K</kbd>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className={cn(
          "flex flex-wrap items-center gap-3 mb-6 p-3 rounded-2xl",
          "bg-white/50 dark:bg-zinc-900/40 backdrop-blur-md",
          "border border-white/30 dark:border-white/[0.08]"
        )}>
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "pl-9 h-8 text-sm rounded-lg",
                "bg-white/60 dark:bg-zinc-800/60",
                "border-white/30 dark:border-white/10",
                "focus-visible:ring-primary/30"
              )}
            />
          </div>

          <div className="w-px h-6 bg-border/50 mx-1" />

          {/* Status filters */}
          <div className="flex items-center gap-1">
            <button
              className={cn(
                "h-7 px-2.5 text-xs font-medium rounded-lg transition-all duration-200",
                statusFilter === 'all' 
                  ? "bg-primary/10 text-primary ring-2 ring-primary/30" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              onClick={() => setStatusFilter('all')}
            >
              All
            </button>
            {PROJECT_STATUS_OPTIONS.map(status => (
              <button
                key={status.value}
                className={cn(
                  "h-7 px-2.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all duration-200",
                  statusFilter === status.value 
                    ? cn("ring-2 ring-primary/30", status.bgColor, status.color)
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                onClick={() => setStatusFilter(status.value as ProjectStatus)}
              >
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  status.dotColor,
                  statusFilter === status.value && "shadow-[0_0_6px_currentColor]"
                )} />
                {status.label}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-border/50 mx-1" />

          {/* Type filters */}
          <div className="flex items-center gap-1">
            <button
              className={cn(
                "h-7 px-2.5 text-xs font-medium rounded-lg transition-all duration-200",
                typeFilter === 'all' 
                  ? "bg-primary/10 text-primary ring-2 ring-primary/30" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              onClick={() => setTypeFilter('all')}
            >
              All Types
            </button>
            {PROJECT_TYPE_OPTIONS.map(type => {
              const TypeIcon = type.icon;
              return (
                <button
                  key={type.value}
                  className={cn(
                    "h-7 px-2.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all duration-200",
                    typeFilter === type.value 
                      ? cn("ring-2 ring-primary/30", type.bgColor, type.color)
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                  onClick={() => setTypeFilter(type.value as ProjectType)}
                >
                  <TypeIcon className="w-3 h-3" />
                  {type.label.split(' / ')[0]}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Projects Grid */}
        <div className="grid auto-rows-[12rem] grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              name={project.name}
              description={project.description}
              color={project.color}
              type={project.type}
              status={project.status}
              isPinned={project.is_pinned}
              taskCount={project.taskCount}
              completedTaskCount={project.completedTaskCount}
              promptCount={project.promptCount}
              notesCount={project.notesCount}
              lastUpdated={project.lastUpdated}
            />
          ))}
          
          {/* New Project Card */}
          <div 
            className={cn(
              "flex items-center justify-center rounded-2xl cursor-pointer transition-all duration-300",
              "border-2 border-dashed border-muted/30 hover:border-primary/30",
              "bg-gradient-to-br from-white/30 to-white/10 dark:from-zinc-900/30 dark:to-zinc-900/10",
              "hover:from-white/50 hover:to-white/30 dark:hover:from-zinc-800/50 dark:hover:to-zinc-800/30",
              "hover:shadow-lg hover:translate-y-[-2px]"
            )}
            onClick={openCreateProjectModal}
          >
            <div className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                "bg-muted/30 group-hover:bg-primary/10"
              )}>
                <Plus className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium">New Project</span>
            </div>
          </div>
        </div>

        {/* Empty states */}
        {filteredProjects.length === 0 && projectsWithCounts.length > 0 && (
          <div className={cn(
            "text-center py-16 rounded-2xl mt-6",
            "bg-white/40 dark:bg-zinc-900/30 backdrop-blur-md",
            "border border-white/30 dark:border-white/[0.08]"
          )}>
            <FolderKanban className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-lg font-medium text-foreground/70">No matching projects</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
          </div>
        )}

        {projectsWithCounts.length === 0 && !loading && (
          <div className={cn(
            "text-center py-16 rounded-2xl",
            "bg-white/40 dark:bg-zinc-900/30 backdrop-blur-md",
            "border border-white/30 dark:border-white/[0.08]"
          )}>
            <FolderKanban className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-lg font-medium text-foreground/70">No projects yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first project to get started</p>
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
