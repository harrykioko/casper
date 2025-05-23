
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CommandModal } from "@/components/modals/CommandModal";
import { CreatePromptModal } from "@/components/modals/CreatePromptModal";
import { PromptDetailModal } from "@/components/modals/PromptDetailModal";
import { PromptHeader } from "@/components/prompts/PromptHeader";
import { PromptFilters } from "@/components/prompts/PromptFilters";
import { PromptGrid } from "@/components/prompts/PromptGrid";
import { PromptEmptyState } from "@/components/prompts/PromptEmptyState";

interface Prompt {
  id: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
}

const mockPrompts: Prompt[] = [
  {
    id: "p1",
    title: "Generate React Component",
    description: "Creates a React component with TypeScript and Tailwind CSS following best practices",
    content: "Create a React component for [component name] with the following features: [features]. The component should follow best practices and be responsive. Use TypeScript and Tailwind CSS for styling.",
    tags: ["react", "development", "ui"]
  },
  {
    id: "p2",
    title: "Code Review Checklist",
    description: "Comprehensive code review template covering performance, security, and best practices",
    content: "Please review my code for the following:\n- Performance issues\n- Security vulnerabilities\n- Readability and maintainability\n- Edge cases\n- Best practices for [language/framework]",
    tags: ["review", "code", "quality"]
  },
  {
    id: "p3",
    title: "Project Status Update Template",
    description: "Structured template for weekly project status updates and communication",
    content: "Here's the status update for [Project Name]:\n\n**Completed This Week:**\n- [list completed items]\n\n**In Progress:**\n- [list in-progress items with % complete]\n\n**Blockers:**\n- [list any blockers]\n\n**Next Week's Goals:**\n- [list upcoming goals]\n\n**Resources Needed:**\n- [list any required resources]",
    tags: ["project", "communication", "status"]
  },
  {
    id: "p4",
    title: "Bug Report Template",
    description: "Standardized bug report format for consistent issue tracking and resolution",
    content: "**Bug Title:** [Clear and concise title]\n\n**Environment:**\n- Browser: [browser name and version]\n- OS: [OS name and version]\n- App version: [version number]\n\n**Steps to Reproduce:**\n1. [Step 1]\n2. [Step 2]\n3. [Step 3]\n\n**Expected Behavior:**\n[What you expected to happen]\n\n**Actual Behavior:**\n[What actually happened]\n\n**Screenshots/Videos:**\n[Attach relevant media]\n\n**Additional Context:**\n[Any other information]",
    tags: ["bug", "qa", "testing"]
  },
  {
    id: "p5",
    title: "UI Animation Specifications",
    description: "Template for defining detailed animation specifications for UI elements",
    content: "For the [element name] animation:\n\n**Animation Type:** [fade/slide/scale/etc.]\n**Duration:** [time in ms]\n**Easing:** [easing function]\n**Trigger:** [on load/on hover/on click/etc.]\n**Direction:** [if applicable]\n**Keyframes:**\n- Start: [state]\n- [Percentage]: [state]\n- End: [state]\n\n**Performance Considerations:**\n[Any notes on performance]",
    tags: ["animation", "ui", "design"]
  },
  {
    id: "p6",
    title: "Database Schema Design",
    description: "Comprehensive template for designing database schemas with relationships and constraints",
    content: "Design a database schema for [application type] with the following requirements:\n\n**Entities:**\n- [Entity 1]\n- [Entity 2]\n...\n\n**Relationships:**\n- [Entity 1] to [Entity 2]: [one-to-one/one-to-many/etc.]\n...\n\n**Fields for each entity:**\n[Entity 1]:\n- id: uuid, primary key\n- [field]: [type], [constraints]\n...\n\n**Indexing Strategy:**\n[Notes on which fields should be indexed]\n\n**Security/Access Patterns:**\n[Notes on security or access patterns]",
    tags: ["database", "architecture", "design"]
  }
];

export default function Prompts() {
  const navigate = useNavigate();
  const location = useLocation();
  const [prompts, setPrompts] = useState<Prompt[]>(mockPrompts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  
  // Handle new prompt action from Command+K
  useEffect(() => {
    if (location.state?.openNewPrompt) {
      navigate(location.pathname, { replace: true });
      setIsCreateModalOpen(true);
    }
  }, [location.state, navigate]);
  
  // Extract all unique tags
  const allTags = Array.from(new Set(prompts.flatMap(prompt => prompt.tags)));
  
  // Filter prompts based on search query and selected tags
  const filteredPrompts = prompts.filter(prompt => {
    const matchesQuery = !searchQuery || 
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => prompt.tags.includes(tag));
    
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
  const handleCreatePrompt = (newPrompt: Omit<Prompt, 'id'>) => {
    const prompt: Prompt = {
      ...newPrompt,
      id: `p${prompts.length + 1}`
    };
    setPrompts(prev => [...prev, prompt]);
  };

  // Handle viewing prompt details
  const handleViewPrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setIsDetailModalOpen(true);
  };

  // Handle updating a prompt
  const handleUpdatePrompt = (updatedPrompt: Prompt) => {
    setPrompts(prev => prev.map(prompt => 
      prompt.id === updatedPrompt.id ? updatedPrompt : prompt
    ));
    setSelectedPrompt(updatedPrompt);
  };
  
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
        
        {filteredPrompts.length === 0 && <PromptEmptyState />}
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
