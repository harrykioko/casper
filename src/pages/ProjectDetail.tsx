
import { useNavigate } from "react-router-dom";
import { CommandModal } from "@/components/modals/CommandModal";
import { CreatePromptModal } from "@/components/modals/CreatePromptModal";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { ProjectContext } from "@/components/projects/ProjectContext";
import { ProjectTasksList } from "@/components/projects/ProjectTasksList";
import { ProjectPromptsList } from "@/components/projects/ProjectPromptsList";
import { ProjectLinksList } from "@/components/projects/ProjectLinksList";
import { AssetsSection } from "@/components/projects/AssetsSection";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjectDetail } from "@/hooks/useProjectDetail";
import { motion } from "framer-motion";

export default function ProjectDetail() {
  const navigate = useNavigate();
  const {
    project,
    tasks,
    prompts,
    links,
    loading,
    isCommandModalOpen,
    isCreatePromptModalOpen,
    openCommandModal,
    closeCommandModal,
    openCreatePromptModal,
    closeCreatePromptModal,
    updateProjectContext,
    addTask,
    addPrompt,
    addLink,
    removeLink
  } = useProjectDetail();
  
  // Handle keyboard shortcut for command modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      openCommandModal();
    }
  };

  if (loading) {
    return (
      <div className="p-8 pl-24 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-10 w-16" />
          </div>
          <Skeleton className="h-32 w-full mb-6" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project.id) {
    return (
      <div className="p-8 pl-24 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-semibold text-muted-foreground">Project not found</h1>
            <p className="text-muted-foreground mt-2">The project you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-8 pl-24 min-h-screen"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="max-w-7xl mx-auto">
        {/* Sticky header */}
        <ProjectHeader 
          projectName={project.name}
          projectColor={project.color}
          openCommandModal={openCommandModal}
        />
        
        {/* Project context */}
        <ProjectContext 
          context={project.context} 
          onUpdateContext={updateProjectContext}
        />
        
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column - Tasks and Assets */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Tasks */}
            <ProjectTasksList 
              tasks={tasks}
              onAddTask={addTask}
            />
            
            {/* Project Assets */}
            <AssetsSection projectId={project.id} />
          </div>
          
          {/* Right column - Prompts and Links */}
          <div className="space-y-6">
            {/* Project Prompts */}
            <ProjectPromptsList 
              prompts={prompts}
              onAddPrompt={openCreatePromptModal}
            />
            
            {/* Project Links */}
            <ProjectLinksList 
              links={links}
              onAddLink={addLink}
              onRemoveLink={removeLink}
            />
          </div>
        </div>
      </div>
      
      {/* Command Modal */}
      <CommandModal 
        isOpen={isCommandModalOpen} 
        onClose={closeCommandModal}
        onNavigate={navigate}
      />
      
      {/* Create Prompt Modal */}
      <CreatePromptModal
        open={isCreatePromptModalOpen}
        onOpenChange={closeCreatePromptModal}
        onCreatePrompt={addPrompt}
      />
    </motion.div>
  );
}
