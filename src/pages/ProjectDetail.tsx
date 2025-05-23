
import { useParams, useNavigate } from "react-router-dom";
import { CommandModal } from "@/components/modals/CommandModal";
import { CreatePromptModal } from "@/components/modals/CreatePromptModal";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { ProjectContext } from "@/components/projects/ProjectContext";
import { ProjectTasksList } from "@/components/projects/ProjectTasksList";
import { ProjectPromptsList } from "@/components/projects/ProjectPromptsList";
import { ProjectLinksList } from "@/components/projects/ProjectLinksList";
import { useProjectDetail } from "@/hooks/useProjectDetail";
import { motion } from "framer-motion";

export default function ProjectDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const {
    project,
    tasks,
    prompts,
    links,
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
          {/* Project Tasks */}
          <ProjectTasksList 
            tasks={tasks}
            onAddTask={addTask}
          />
          
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
