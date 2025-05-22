
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderKanban, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommandModal } from "@/components/modals/CommandModal";

interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  taskCount: number;
}

const mockProjects: Project[] = [
  {
    id: "p1",
    name: "Casper",
    description: "Personal task & project management command center",
    color: "#FF1464", 
    taskCount: 12
  },
  {
    id: "p2",
    name: "Research",
    description: "Notes and articles for learning new technologies",
    color: "#2B2DFF",
    taskCount: 5
  },
  {
    id: "p3",
    name: "Personal",
    description: "Errands and personal to-dos",
    color: "#00CFDD",
    taskCount: 8
  }
];

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  
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
            <Button variant="outline" className="gap-2">
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="hover:glassmorphic transition-all duration-200 cursor-pointer"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <div 
                    className="h-5 w-5 rounded-md" 
                    style={{ backgroundColor: project.color }}
                  />
                  {project.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {project.description}
                </p>
                <div className="flex items-center text-sm">
                  <FolderKanban className="h-4 w-4 mr-1.5 text-muted-foreground" />
                  <span>
                    {project.taskCount} {project.taskCount === 1 ? 'task' : 'tasks'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
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
