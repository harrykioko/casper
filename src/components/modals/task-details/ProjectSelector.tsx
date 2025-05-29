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
      <Select onValueChange={(value) => {
        const project = projects.find((p) => p.id === value);
        setSelectedProject(project);
      }}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select project" defaultValue={selectedProject?.id} />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
          <SelectItem value="">No project</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
