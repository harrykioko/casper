
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CommandModal } from "@/components/modals/CommandModal";
import { CreatePromptModal } from "@/components/modals/CreatePromptModal";
import { PromptDetailModal } from "@/components/modals/PromptDetailModal";
import { PromptHeader } from "@/components/prompts/PromptHeader";
import { PromptFilters } from "@/components/prompts/PromptFilters";
import { PromptGrid } from "@/components/prompts/PromptGrid";
import { PromptEmptyState } from "@/components/prompts/PromptEmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrompts } from "@/hooks/usePrompts";

export default function Prompts() {
  const navigate = useNavigate();
  const location = useLocation();
  const { prompts, loading, createPrompt, updatePrompt } = usePrompts();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<any | null>(null);
  
  // Handle new prompt action from Command+K
  useEffect(() => {
    if (location.state?.openNewPrompt) {
      navigate(location.pathname, { replace: true });
      setIsCreateModalOpen(true);
    }
  }, [location.state, navigate]);
  
  // Extract all unique tags
  const allTags = Array.from(new Set(prompts.flatMap(prompt => prompt.tags || [])));
  
  // Filter prompts based on search query and selected tags
  const filteredPrompts = prompts.filter(prompt => {
    const matchesQuery = !searchQuery || 
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prompt.description && prompt.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      prompt.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => prompt.tags?.includes(tag));
    
    return matchesQuery && matchesTags;
  });
  
  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };
  
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
  
  // Handle adding a new prompt 
  const handleNewPrompt = () => {
    setIsCreateModalOpen(true);
  };

  // Handle creating a prompt
  const handleCreatePrompt = async (newPrompt: any) => {
    try {
      await createPrompt(newPrompt);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Failed to create prompt:', error);
    }
  };

  // Handle viewing prompt details
  const handleViewPrompt = (prompt: any) => {
    setSelectedPrompt(prompt);
    setIsDetailModalOpen(true);
  };

  // Handle updating a prompt
  const handleUpdatePrompt = async (updatedPrompt: any) => {
    try {
      await updatePrompt(updatedPrompt.id, updatedPrompt);
      setSelectedPrompt(updatedPrompt);
    } catch (error) {
      console.error('Failed to update prompt:', error);
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
          <div className="mb-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="flex gap-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-16" />
              ))}
            </div>
          </div>
          <div className="grid auto-rows-[12rem] grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-6">
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
        <PromptHeader 
          onNewPrompt={handleNewPrompt}
          onOpenCommand={openCommandModal}
        />
        
        <PromptFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          allTags={allTags}
          selectedTags={selectedTags}
          onToggleTag={toggleTag}
        />
        
        <PromptGrid 
          prompts={filteredPrompts}
          onViewPrompt={handleViewPrompt}
        />
        
        {filteredPrompts.length === 0 && !loading && <PromptEmptyState />}
      </div>
      
      {/* Modals */}
      <CommandModal 
        isOpen={isCommandModalOpen} 
        onClose={closeCommandModal}
        onNavigate={navigate}
      />

      <CreatePromptModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onCreatePrompt={handleCreatePrompt}
      />

      <PromptDetailModal
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        prompt={selectedPrompt}
        onUpdatePrompt={handleUpdatePrompt}
      />
    </div>
  );
}
