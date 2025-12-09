import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CommandModal } from "@/components/modals/CommandModal";
import { CreatePromptModal } from "@/components/modals/CreatePromptModal";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { ProjectContext } from "@/components/projects/ProjectContext";
import { ProjectTasksList } from "@/components/projects/ProjectTasksList";
import { ProjectPromptsList } from "@/components/projects/ProjectPromptsList";
import { ProjectLinksList } from "@/components/projects/ProjectLinksList";
import { ProjectNotesSection } from "@/components/projects/ProjectNotesSection";
import { ProjectCommandPanel } from "@/components/projects/ProjectCommandPanel";
import { ProjectDetailPane } from "@/components/projects/ProjectDetailPane";
import { AssetsSection } from "@/components/projects/AssetsSection";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjectDetail } from "@/hooks/useProjectDetail";
import { useProjectNotes, ProjectNote } from "@/hooks/useProjectNotes";
import { motion } from "framer-motion";
import { ProjectType, ProjectStatus } from "@/lib/constants/projectTypes";

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
    updateProjectMetadata,
    addTask,
    addPrompt,
    addLink,
    removeLink
  } = useProjectDetail();
  
  const { notes, createNote, updateNote, deleteNote } = useProjectNotes();
  const [activeSection, setActiveSection] = useState('all');
  const [selectedNote, setSelectedNote] = useState<ProjectNote | null>(null);
  
  // Handle keyboard shortcut for command modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      openCommandModal();
    }
  };

  const handleTogglePin = async () => {
    if (updateProjectMetadata) {
      await updateProjectMetadata({ is_pinned: !project.is_pinned });
    }
  };

  const handleStatusChange = async (status: ProjectStatus) => {
    if (updateProjectMetadata) {
      await updateProjectMetadata({ status });
    }
  };

  // Calculate stats
  const stats = {
    notesCount: notes.length,
    tasksCount: tasks.length,
    completedTasksCount: tasks.filter(t => t.completed).length,
    readingItemsCount: links.length,
    promptsCount: prompts.length,
    assetsCount: 0, // Will be updated when assets hook is integrated
  };

  // Filter content based on active section
  const showNotes = activeSection === 'all' || activeSection === 'notes';
  const showTasks = activeSection === 'all' || activeSection === 'tasks';
  const showReading = activeSection === 'all' || activeSection === 'reading';
  const showPrompts = activeSection === 'all' || activeSection === 'prompts';
  const showAssets = activeSection === 'all' || activeSection === 'assets';

  if (loading) {
    return (
      <div className="flex h-screen">
        <div className="w-[280px] border-r border-border/50 p-4">
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-20 w-full mb-4" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-12 w-full mb-6" />
          <div className="grid lg:grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
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
      className="flex h-screen overflow-hidden"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Left Command Panel */}
      <ProjectCommandPanel
        projectName={project.name}
        projectColor={project.color}
        projectType={(project.type as ProjectType) || 'other'}
        projectStatus={(project.status as ProjectStatus) || 'active'}
        isPinned={project.is_pinned || false}
        stats={stats}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onTogglePin={handleTogglePin}
        onStatusChange={handleStatusChange}
      />

      {/* Center Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-4xl">
          {/* Project Header */}
          <ProjectHeader 
            projectName={project.name}
            projectColor={project.color}
            projectType={(project.type as ProjectType) || 'other'}
            projectStatus={(project.status as ProjectStatus) || 'active'}
            isPinned={project.is_pinned || false}
            onTogglePin={handleTogglePin}
            openCommandModal={openCommandModal}
          />
          
          {/* Project context */}
          <ProjectContext 
            context={project.context} 
            onUpdateContext={updateProjectContext}
          />
          
          <div className="space-y-6 mt-6">
            {/* Notes Section */}
            {showNotes && (
              <ProjectNotesSection
                notes={notes}
                onCreateNote={createNote}
                onUpdateNote={updateNote}
                onDeleteNote={deleteNote}
                onSelectNote={setSelectedNote}
                selectedNoteId={selectedNote?.id}
              />
            )}

            {/* Tasks Section */}
            {showTasks && (
              <ProjectTasksList 
                tasks={tasks}
                onAddTask={addTask}
              />
            )}
            
            {/* Reading Items Section */}
            {showReading && (
              <ProjectLinksList 
                links={links}
                onAddLink={addLink}
                onRemoveLink={removeLink}
              />
            )}

            {/* Prompts Section */}
            {showPrompts && (
              <ProjectPromptsList 
                prompts={prompts}
                onAddPrompt={openCreatePromptModal}
              />
            )}
            
            {/* Assets Section */}
            {showAssets && (
              <AssetsSection projectId={project.id} />
            )}
          </div>
        </div>
      </div>

      {/* Right Detail Pane */}
      <ProjectDetailPane
        selectedNote={selectedNote}
        onClose={() => setSelectedNote(null)}
        onUpdateNote={updateNote}
        onDeleteNote={deleteNote}
      />
      
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
