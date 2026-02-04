import { useMemo, useState } from "react";
import {
  Search,
  CheckSquare,
  Circle,
  Loader2,
  CheckCircle2,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  List,
  LayoutGrid,
  Filter,
  Sparkles,
  Archive,
  ChevronDown,
  Zap,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useCategories } from "@/hooks/useCategories";
import { useProjects } from "@/hooks/useProjects";
import type { Task } from "@/hooks/useTasks";

interface TasksSummaryPanelProps {
  tasks: Task[];
  triageCount: number;
  archivedCount: number;
  statusFilter: string;
  onStatusFilterChange: (filter: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (filter: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (filter: string) => void;
  projectFilter: string;
  onProjectFilterChange: (filter: string) => void;
  sortBy: string;
  onSortByChange: (sort: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  viewMode: "list" | "kanban";
  onViewModeChange: (mode: "list" | "kanban") => void;
  showTriage: boolean;
  onShowTriageChange: (show: boolean) => void;
  showArchived: boolean;
  onShowArchivedChange: (show: boolean) => void;
}

interface StatChipProps {
  label: string;
  count: number;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  colorClass: string;
  subtle?: boolean;
}

function StatChip({ label, count, icon, isActive, onClick, colorClass, subtle }: StatChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all w-full",
        isActive
          ? `${colorClass}`
          : subtle 
            ? "text-muted-foreground hover:bg-muted/50"
            : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
      )}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      <span className={cn(
        "min-w-[20px] h-5 px-1.5 rounded-full text-xs flex items-center justify-center",
        isActive ? "bg-white/20" : "bg-muted-foreground/10"
      )}>
        {count}
      </span>
    </button>
  );
}

export function TasksSummaryPanel({
  tasks,
  triageCount,
  archivedCount,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  projectFilter,
  onProjectFilterChange,
  sortBy,
  onSortByChange,
  searchQuery,
  onSearchQueryChange,
  viewMode,
  onViewModeChange,
  showTriage,
  onShowTriageChange,
  showArchived,
  onShowArchivedChange,
}: TasksSummaryPanelProps) {
  const { categories, loading: categoriesLoading } = useCategories();
  const { projects, loading: projectsLoading } = useProjects();
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);

  const counts = useMemo(() => {
    const all = tasks.length;
    const todo = tasks.filter(t => !t.status || t.status === "todo").length;
    const inProgress = tasks.filter(t => t.status === "inprogress").length;
    const done = tasks.filter(t => t.status === "done" || t.completed).length;
    const high = tasks.filter(t => t.priority === "high").length;
    const medium = tasks.filter(t => t.priority === "medium").length;
    const low = tasks.filter(t => t.priority === "low").length;
    // Ready to work count
    const ready = tasks.filter(t => {
      const isHighPriority = t.priority === 'high' || t.priority === 'medium';
      const hasDueDate = !!t.scheduledFor;
      const isNotDone = t.status !== 'done' && !t.completed;
      return (isHighPriority || hasDueDate) && isNotDone;
    }).length;
    return { all, todo, inProgress, done, high, medium, low, ready };
  }, [tasks]);

  return (
    <div className="sticky top-24 space-y-4">
      <div className="rounded-2xl bg-card/50 backdrop-blur-sm p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="pl-10 h-9 text-sm bg-muted/30 border-muted/30"
          />
        </div>

        {/* View Mode */}
        <div className="space-y-2">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            View
          </p>
          <div className="space-y-1">
            <StatChip
              label="Ready to Work"
              count={counts.ready}
              icon={<Zap className="h-4 w-4" />}
              isActive={statusFilter === "ready"}
              onClick={() => onStatusFilterChange("ready")}
              colorClass="bg-primary/10 text-primary"
            />
            <StatChip
              label="All Tasks"
              count={counts.all}
              icon={<CheckSquare className="h-4 w-4" />}
              isActive={statusFilter === "all"}
              onClick={() => onStatusFilterChange("all")}
              colorClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Status
          </p>
          <div className="space-y-1">
            <StatChip
              label="To Do"
              count={counts.todo}
              icon={<Circle className="h-4 w-4" />}
              isActive={statusFilter === "todo"}
              onClick={() => onStatusFilterChange("todo")}
              colorClass="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
              subtle
            />
            <StatChip
              label="In Progress"
              count={counts.inProgress}
              icon={<Loader2 className="h-4 w-4" />}
              isActive={statusFilter === "progress"}
              onClick={() => onStatusFilterChange("progress")}
              colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
              subtle
            />
            <StatChip
              label="Done"
              count={counts.done}
              icon={<CheckCircle2 className="h-4 w-4" />}
              isActive={statusFilter === "done"}
              onClick={() => onStatusFilterChange("done")}
              colorClass="bg-green-500/10 text-green-600 dark:text-green-400"
              subtle
            />
          </div>
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Priority
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => onPriorityFilterChange(priorityFilter === "high" ? "all" : "high")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all",
                priorityFilter === "high"
                  ? "bg-destructive/10 text-destructive"
                  : "text-muted-foreground hover:bg-muted/50"
              )}
            >
              <ArrowUp className="h-3 w-3" />
              {counts.high}
            </button>
            <button
              onClick={() => onPriorityFilterChange(priorityFilter === "medium" ? "all" : "medium")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all",
                priorityFilter === "medium"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground hover:bg-muted/50"
              )}
            >
              <ArrowRight className="h-3 w-3" />
              {counts.medium}
            </button>
            <button
              onClick={() => onPriorityFilterChange(priorityFilter === "low" ? "all" : "low")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all",
                priorityFilter === "low"
                  ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                  : "text-muted-foreground hover:bg-muted/50"
              )}
            >
              <ArrowDown className="h-3 w-3" />
              {counts.low}
            </button>
          </div>
        </div>

        {/* More Filters (Collapsible) */}
        <Collapsible open={moreFiltersOpen} onOpenChange={setMoreFiltersOpen}>
          <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
            <Filter className="h-3 w-3" />
            <span>More filters</span>
            <ChevronDown className={cn("h-3 w-3 ml-auto transition-transform", moreFiltersOpen && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-2">
            <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
              <SelectTrigger className="w-full h-8 text-xs bg-muted/30 border-muted/30">
                <span className="text-muted-foreground mr-1">Category:</span>
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

            <Select value={projectFilter} onValueChange={onProjectFilterChange}>
              <SelectTrigger className="w-full h-8 text-xs bg-muted/30 border-muted/30">
                <span className="text-muted-foreground mr-1">Project:</span>
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

            <Select value={sortBy} onValueChange={onSortByChange}>
              <SelectTrigger className="w-full h-8 text-xs bg-muted/30 border-muted/30">
                <span className="text-muted-foreground mr-1">Sort:</span>
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent className="bg-popover backdrop-blur-md border border-muted/40 z-50">
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </CollapsibleContent>
        </Collapsible>

        {/* View Mode Toggle */}
        <div className="pt-3 border-t border-border/50 space-y-2">
          <div className="flex gap-1">
            <button
              onClick={() => onViewModeChange("list")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-1 justify-center",
                viewMode === "list"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50"
              )}
            >
              <List className="h-3.5 w-3.5" />
              List
            </button>
            <button
              onClick={() => onViewModeChange("kanban")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-1 justify-center",
                viewMode === "kanban"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Kanban
            </button>
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-2">
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Triage</span>
              {triageCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  {triageCount}
                </span>
              )}
            </div>
            <Switch
              checked={showTriage}
              onCheckedChange={onShowTriageChange}
              className="scale-75"
            />
          </div>

          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <Archive className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Archived</span>
              {archivedCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {archivedCount}
                </span>
              )}
            </div>
            <Switch
              checked={showArchived}
              onCheckedChange={onShowArchivedChange}
              className="scale-75"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
