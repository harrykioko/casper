import { useMemo } from "react";
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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
}

function StatChip({ label, count, icon, isActive, onClick, colorClass }: StatChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all w-full",
        "border",
        isActive
          ? `${colorClass} border-current`
          : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
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

  const counts = useMemo(() => {
    const all = tasks.length;
    const todo = tasks.filter(t => !t.status || t.status === "todo").length;
    const inProgress = tasks.filter(t => t.status === "inprogress").length;
    const done = tasks.filter(t => t.status === "done" || t.completed).length;
    const high = tasks.filter(t => t.priority === "high").length;
    const medium = tasks.filter(t => t.priority === "medium").length;
    const low = tasks.filter(t => t.priority === "low").length;
    return { all, todo, inProgress, done, high, medium, low };
  }, [tasks]);

  return (
    <div className="sticky top-24 space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Tasks Command</h2>
            <p className="text-xs text-muted-foreground">Manage your work</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="pl-10 h-9 text-sm"
          />
        </div>

        {/* By Status */}
        <div className="space-y-1.5 mb-4">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            By Status
          </p>
          <StatChip
            label="All Items"
            count={counts.all}
            icon={<CheckSquare className="h-4 w-4" />}
            isActive={statusFilter === "all"}
            onClick={() => onStatusFilterChange("all")}
            colorClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          />
          <StatChip
            label="To Do"
            count={counts.todo}
            icon={<Circle className="h-4 w-4" />}
            isActive={statusFilter === "todo"}
            onClick={() => onStatusFilterChange("todo")}
            colorClass="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
          />
          <StatChip
            label="In Progress"
            count={counts.inProgress}
            icon={<Loader2 className="h-4 w-4" />}
            isActive={statusFilter === "progress"}
            onClick={() => onStatusFilterChange("progress")}
            colorClass="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          />
          <StatChip
            label="Done"
            count={counts.done}
            icon={<CheckCircle2 className="h-4 w-4" />}
            isActive={statusFilter === "done"}
            onClick={() => onStatusFilterChange("done")}
            colorClass="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          />
          <StatChip
            label="Archived"
            count={archivedCount}
            icon={<Archive className="h-4 w-4" />}
            isActive={showArchived}
            onClick={() => onShowArchivedChange(!showArchived)}
            colorClass="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
          />
        </div>

        {/* By Priority */}
        <div className="space-y-1.5 mb-4">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            By Priority
          </p>
          <StatChip
            label="High"
            count={counts.high}
            icon={<ArrowUp className="h-4 w-4" />}
            isActive={priorityFilter === "high"}
            onClick={() => onPriorityFilterChange(priorityFilter === "high" ? "all" : "high")}
            colorClass="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          />
          <StatChip
            label="Medium"
            count={counts.medium}
            icon={<ArrowRight className="h-4 w-4" />}
            isActive={priorityFilter === "medium"}
            onClick={() => onPriorityFilterChange(priorityFilter === "medium" ? "all" : "medium")}
            colorClass="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          />
          <StatChip
            label="Low"
            count={counts.low}
            icon={<ArrowDown className="h-4 w-4" />}
            isActive={priorityFilter === "low"}
            onClick={() => onPriorityFilterChange(priorityFilter === "low" ? "all" : "low")}
            colorClass="bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
          />
        </div>

        {/* Filters (dropdowns) */}
        <div className="space-y-3 mb-4">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Filters
          </p>
          <div className="space-y-2">
            <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
              <SelectTrigger className="w-full h-8 text-sm">
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
              <SelectTrigger className="w-full h-8 text-sm">
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
              <SelectTrigger className="w-full h-8 text-sm">
                <span className="text-muted-foreground mr-1">Sort by:</span>
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

        {/* View Controls */}
        <div className="pt-4 border-t border-border space-y-3">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            View
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => onViewModeChange("list")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center",
                viewMode === "list"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              <List className="h-4 w-4" />
              List
            </button>
            <button
              onClick={() => onViewModeChange("kanban")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center",
                viewMode === "kanban"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              Kanban
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Show Triage</span>
              {triageCount > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full text-xs flex items-center justify-center bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  {triageCount}
                </span>
              )}
            </div>
            <Switch
              checked={showTriage}
              onCheckedChange={onShowTriageChange}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Archive className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Show Archived</span>
              {archivedCount > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full text-xs flex items-center justify-center bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                  {archivedCount}
                </span>
              )}
            </div>
            <Switch
              checked={showArchived}
              onCheckedChange={onShowArchivedChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
