
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";

interface ProjectSelectorProps {
  selectedProject: Task["project"] | undefined;
  setSelectedProject: (project: Task["project"] | undefined) => void;
}

export function ProjectSelector({ selectedProject, setSelectedProject }: ProjectSelectorProps) {
  const { projects } = useProjects();

  return (
    <div>
      <Select 
        value={selectedProject?.id || "none"} 
        onValueChange={(value) => {
          if (value === "none") {
            setSelectedProject(undefined);
          } else {
            const project = projects.find((p) => p.id === value);
            if (project) {
              setSelectedProject({
                id: project.id,
                name: project.name,
                color: project.color || "#FF1464"
              });
            }
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
