
import { Task } from "@/components/dashboard/TaskSection";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <label className="text-xs uppercase text-white/50 tracking-wide block">Project</label>
      <div className="flex items-center gap-2">
        <Select
          value={selectedProject?.id}
          onValueChange={(value) => {
            if (value) {
              const project = mockProjects.find((p) => p.id === value);
              onSelectProject(project);
            }
          }}
        >
          <SelectTrigger 
            className={cn(
              "w-full bg-white/5 border border-white/10 rounded-md text-sm focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:ring-offset-0 focus-visible:outline-none",
              !selectedProject && "text-white/40"
            )}
          >
            <SelectValue 
              placeholder="Select a project" 
              className="placeholder:text-white/40"
            >
              {selectedProject && (
                <div className="flex items-center">
                  <div 
                    className="w-2 h-2 rounded-full mr-1.5 inline-block"
                    style={{backgroundColor: selectedProject.color}}
                  />
                  {selectedProject.name}
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border border-white/10 text-white">
            <SelectGroup>
              {mockProjects.map((project) => (
                <SelectItem 
                  key={project.id} 
                  value={project.id}
                  className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                >
                  <div className="flex items-center">
                    <div
                      className="w-2 h-2 rounded-full mr-1.5 inline-block"
                      style={{backgroundColor: project.color}}
                    />
                    {project.name}
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        
        {selectedProject && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 bg-white/5 hover:bg-white/10 hover:text-red-400 rounded-full"
            title="Clear project"
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
