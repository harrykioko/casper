
import { useParams, useNavigate } from "react-router-dom";
import { CommandModal } from "@/components/modals/CommandModal";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { ProjectContext } from "@/components/projects/ProjectContext";
import { ProjectTasksList } from "@/components/projects/ProjectTasksList";
import { ProjectPromptsList } from "@/components/projects/ProjectPromptsList";
import { ProjectLinksList } from "@/components/projects/ProjectLinksList";
import { useProjectDetail } from "@/hooks/useProjectDetail";

export default function ProjectDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const {
    project,
    tasks,
    prompts,
    links,
    isCommandModalOpen,
    openCommandModal,
    closeCommandModal
  } = useProjectDetail();
  
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
      <div className="max-w-7xl mx-auto">
        {/* Sticky header */}
        <ProjectHeader 
          projectName={project.name}
          projectColor={project.color}
          openCommandModal={openCommandModal}
        />
        
        {/* Project context */}
        <ProjectContext context={project.context} />
        
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Project Tasks */}
          <ProjectTasksList tasks={tasks} />
          
          <div className="space-y-6">
            {/* Project Prompts */}
            <ProjectPromptsList prompts={prompts} />
            
            {/* Project Links */}
            <ProjectLinksList links={links} />
          </div>
        </div>
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
