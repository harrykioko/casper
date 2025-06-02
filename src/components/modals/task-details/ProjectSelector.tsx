
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task } from "@/hooks/useTasks";

interface ProjectSelectorProps {
  selectedProject: Task["project"] | undefined;
  setSelectedProject: (project: Task["project"] | undefined) => void;
}

export function ProjectSelector({ selectedProject, setSelectedProject }: ProjectSelectorProps) {
  const projects = [
    { id: "p1", name: "Casper", color: "#FF1464" },
    { id: "p2", name: "Research", color: "#2B2DFF" },
    { id: "p3", name: "Personal", color: "#10B981" },
  ];

  return (
    <div>
      <Select 
        value={selectedProject?.id || "none"} 
        onValueChange={(value) => {
          if (value === "none") {
            setSelectedProject(undefined);
          } else {
            const project = projects.find((p) => p.id === value);
            setSelectedProject(project);
          }
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select project" />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
          <SelectItem value="none">No project</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
