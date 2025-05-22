
import { Button } from "@/components/ui/button";
import { Task } from "@/components/dashboard/TaskSection";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ProjectSelectorProps {
  selectedProject?: Task["project"];
  onSelectProject: (project?: Task["project"]) => void;
}

// Mock projects - in a real app, these would come from a projects store
const mockProjects = [
  { id: "1", name: "Personal", color: "#FF6B6B" },
  { id: "2", name: "Work", color: "#4ECDC4" },
  { id: "3", name: "Learning", color: "#9D65C9" }
];

export function ProjectSelector({ selectedProject, onSelectProject }: ProjectSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium block">Project</label>
      <div className="flex flex-wrap gap-2">
        {mockProjects.map((project) => (
          <Button
            key={project.id}
            type="button"
            variant="outline"
            className={cn(
              "h-8 px-3 text-sm rounded-full",
              selectedProject?.id === project.id
                ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white border-transparent"
                : "bg-white/5 hover:bg-white/15 border border-white/10"
            )}
            onClick={() => onSelectProject(project)}
            style={selectedProject?.id !== project.id ? {} : undefined}
          >
            <div 
              className="w-2 h-2 rounded-full mr-1.5 inline-block"
              style={{backgroundColor: project.color}}
            />
            {project.name}
          </Button>
        ))}
        {selectedProject && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 bg-white/5 hover:bg-white/10 rounded-full"
            onClick={() => onSelectProject(undefined)}
          >
            <X className="h-3.5 w-3.5" />
            <span className="sr-only">Clear selection</span>
          </Button>
        )}
      </div>
    </div>
  );
}
