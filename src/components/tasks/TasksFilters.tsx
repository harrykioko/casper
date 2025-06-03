
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface TasksFiltersProps {
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  priorityFilter: string;
  setPriorityFilter: (value: string) => void;
}

export function TasksFilters({ 
  statusFilter, 
  setStatusFilter, 
  priorityFilter, 
  setPriorityFilter 
}: TasksFiltersProps) {
  return (
    <div className="bg-muted/30 backdrop-blur-md border border-muted/30 rounded-md p-2">
      <div className="flex flex-wrap gap-4 items-end">
        {/* Category Filter */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Category</label>
          <Select>
            <SelectTrigger className="w-32 h-8 text-sm bg-background/50 hover:ring-muted/50">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="work">Work</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Project Filter */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Project</label>
          <Select>
            <SelectTrigger className="w-32 h-8 text-sm bg-background/50 hover:ring-muted/50">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="project1">Project 1</SelectItem>
              <SelectItem value="project2">Project 2</SelectItem>
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
          <Select>
            <SelectTrigger className="w-32 h-8 text-sm bg-background/50 hover:ring-muted/50">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
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
