
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useCategories } from "@/hooks/useCategories";
import { useProjects } from "@/hooks/useProjects";

interface TasksFiltersProps {
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  priorityFilter: string;
  setPriorityFilter: (value: string) => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  projectFilter: string;
  setProjectFilter: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
}

export function TasksFilters({ 
  statusFilter, 
  setStatusFilter, 
  priorityFilter, 
  setPriorityFilter,
  categoryFilter,
  setCategoryFilter,
  projectFilter,
  setProjectFilter,
  sortBy,
  setSortBy
}: TasksFiltersProps) {
  const { categories, loading: categoriesLoading } = useCategories();
  const { projects, loading: projectsLoading } = useProjects();

  return (
    <div className="bg-muted/30 backdrop-blur-md border border-muted/30 rounded-md p-2">
      <div className="flex flex-wrap gap-4 items-end">
        {/* Category Filter */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Category</label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-32 h-8 text-sm bg-background/50 hover:ring-muted/50">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="bg-popover backdrop-blur-md border border-muted/40 z-50">
              <SelectItem value="all">All</SelectItem>
              {categoriesLoading ? (
                <SelectItem value="loading" disabled>Loading...</SelectItem>
              ) : (
                categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Project Filter */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Project</label>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-32 h-8 text-sm bg-background/50 hover:ring-muted/50">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="bg-popover backdrop-blur-md border border-muted/40 z-50">
              <SelectItem value="all">All</SelectItem>
              {projectsLoading ? (
                <SelectItem value="loading" disabled>Loading...</SelectItem>
              ) : (
                projects.map((project) => (
                  <SelectItem key={project.id} value={project.name}>
                    {project.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Status</label>
          <ToggleGroup type="single" value={statusFilter} onValueChange={setStatusFilter} className="gap-1">
            <ToggleGroupItem value="all" size="sm" className="h-8 px-3 text-xs">All</ToggleGroupItem>
            <ToggleGroupItem value="todo" size="sm" className="h-8 px-3 text-xs">To Do</ToggleGroupItem>
            <ToggleGroupItem value="progress" size="sm" className="h-8 px-3 text-xs">In Progress</ToggleGroupItem>
            <ToggleGroupItem value="done" size="sm" className="h-8 px-3 text-xs">Done</ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Priority Filter */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Priority</label>
          <ToggleGroup type="single" value={priorityFilter} onValueChange={setPriorityFilter} className="gap-1">
            <ToggleGroupItem value="all" size="sm" className="h-8 px-3 text-xs">All</ToggleGroupItem>
            <ToggleGroupItem value="high" size="sm" className="h-8 px-3 text-xs">High</ToggleGroupItem>
            <ToggleGroupItem value="medium" size="sm" className="h-8 px-3 text-xs">Medium</ToggleGroupItem>
            <ToggleGroupItem value="low" size="sm" className="h-8 px-3 text-xs">Low</ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Sort By Filter */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Sort By</label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32 h-8 text-sm bg-background/50 hover:ring-muted/50">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent className="bg-popover backdrop-blur-md border border-muted/40 z-50">
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="project">Project</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
