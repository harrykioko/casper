
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MessageSquareText, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CommandModal } from "@/components/modals/CommandModal";

interface Prompt {
  id: string;
  title: string;
  content: string;
  tags: string[];
}

const mockPrompts: Prompt[] = [
  {
    id: "p1",
    title: "Generate React Component",
    content: "Create a React component for [component name] with the following features: [features]. The component should follow best practices and be responsive. Use TypeScript and Tailwind CSS for styling.",
    tags: ["react", "development", "ui"]
  },
  {
    id: "p2",
    title: "Code Review Checklist",
    content: "Please review my code for the following:\n- Performance issues\n- Security vulnerabilities\n- Readability and maintainability\n- Edge cases\n- Best practices for [language/framework]",
    tags: ["review", "code", "quality"]
  },
  {
    id: "p3",
    title: "Project Status Update Template",
    content: "Here's the status update for [Project Name]:\n\n**Completed This Week:**\n- [list completed items]\n\n**In Progress:**\n- [list in-progress items with % complete]\n\n**Blockers:**\n- [list any blockers]\n\n**Next Week's Goals:**\n- [list upcoming goals]\n\n**Resources Needed:**\n- [list any required resources]",
    tags: ["project", "communication", "status"]
  },
  {
    id: "p4",
    title: "Bug Report Template",
    content: "**Bug Title:** [Clear and concise title]\n\n**Environment:**\n- Browser: [browser name and version]\n- OS: [OS name and version]\n- App version: [version number]\n\n**Steps to Reproduce:**\n1. [Step 1]\n2. [Step 2]\n3. [Step 3]\n\n**Expected Behavior:**\n[What you expected to happen]\n\n**Actual Behavior:**\n[What actually happened]\n\n**Screenshots/Videos:**\n[Attach relevant media]\n\n**Additional Context:**\n[Any other information]",
    tags: ["bug", "qa", "testing"]
  },
  {
    id: "p5",
    title: "UI Animation Specifications",
    content: "For the [element name] animation:\n\n**Animation Type:** [fade/slide/scale/etc.]\n**Duration:** [time in ms]\n**Easing:** [easing function]\n**Trigger:** [on load/on hover/on click/etc.]\n**Direction:** [if applicable]\n**Keyframes:**\n- Start: [state]\n- [Percentage]: [state]\n- End: [state]\n\n**Performance Considerations:**\n[Any notes on performance]",
    tags: ["animation", "ui", "design"]
  },
  {
    id: "p6",
    title: "Database Schema Design",
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
  
  // Handle new prompt action from Command+K
  useEffect(() => {
    if (location.state?.openNewPrompt) {
      // Reset the state to prevent reopening on refresh
      navigate(location.pathname, { replace: true });
      // Here you would open your new prompt dialog
      handleNewPrompt();
    }
  }, [location.state, navigate]);
  
  // Extract all unique tags
  const allTags = Array.from(new Set(prompts.flatMap(prompt => prompt.tags)));
  
  // Filter prompts based on search query and selected tags
  const filteredPrompts = prompts.filter(prompt => {
    const matchesQuery = !searchQuery || 
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
    console.log("Creating new prompt");
    // Here you would open a modal to create a new prompt
    // For now, we'll just log it
    // In a real implementation, this would open a dialog
  };
  
  return (
    <div 
      className="p-8 pl-24 min-h-screen"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Prompt Library</h1>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleNewPrompt}
            >
              <Plus className="h-4 w-4" />
              <span>New Prompt</span>
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
        
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search prompts..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            {allTags.map(tag => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrompts.map((prompt) => (
            <Card
              key={prompt.id}
              className="hover:glassmorphic transition-all duration-200 cursor-pointer overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquareText className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">{prompt.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {prompt.content}
                </p>
                <div className="flex flex-wrap gap-2">
                  {prompt.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        {filteredPrompts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquareText className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-lg font-medium">No prompts found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
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
