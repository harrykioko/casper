
import { useState, useEffect, useRef } from "react";
import { Plus, List, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { useTasksManager } from "@/hooks/useTasksManager";
import { TaskSection } from "@/components/dashboard/TaskSection";

export default function Tasks() {
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [newTask, setNewTask] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    tasks,
    handleAddTask,
    handleCompleteTask,
    handleDeleteTask,
    handleUpdateTaskStatus,
    handleUpdateTask
  } = useTasksManager();

  // Filter tasks into quick tasks and regular tasks
  const quickTasks = tasks.filter(task => task.is_quick_task);
  const regularTasks = tasks.filter(task => !task.is_quick_task);

  // Auto-focus input on page load
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleAddQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      handleAddTask(newTask, true); // Create as quick task
      setNewTask("");
    }
  };

  const handleViewModeChange = (mode: "list" | "kanban") => {
    if (mode === "kanban") {
      // Don't actually change the view, just show tooltip
      return;
    }
    setViewMode(mode);
  };

  const handleQuickTaskClick = (taskId: number) => {
    console.log("Opening task details for:", taskId);
    // Future: open details modal
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Quick Add Input Bar */}
          <form onSubmit={handleAddQuickTask} className="w-full">
            <div className="relative flex items-center gap-3 p-3 rounded-xl bg-muted/20 backdrop-blur-md border border-muted/30 hover:ring-1 hover:ring-white/20 transition-all">
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="rounded-full h-8 w-8 flex-shrink-0 text-primary hover:bg-primary/10"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Input
                ref={inputRef}
                type="text"
                placeholder="Add a quick task… (press Tab to enrich)"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none text-base placeholder:text-muted-foreground"
              />
            </div>
          </form>

          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleViewModeChange("list")}
              className={cn(
                "flex items-center gap-2 rounded-full transition-all",
                viewMode === "list" 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-4 w-4" />
              List View
            </Button>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewModeChange("kanban")}
                  className="flex items-center gap-2 rounded-full transition-all text-muted-foreground hover:text-foreground"
                >
                  <LayoutGrid className="h-4 w-4" />
                  Kanban View
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Coming Soon</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Filters Row */}
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

          {/* Main Content Layout */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Main Tasks (70% width) */}
            <div className="flex-1 lg:w-[70%]">
              <Card className="glassmorphic border-muted/30">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold">Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  {regularTasks.length > 0 ? (
                    <TaskSection
                      tasks={regularTasks}
                      onAddTask={(content) => handleAddTask(content, false)}
                      onTaskComplete={handleCompleteTask}
                      onTaskDelete={handleDeleteTask}
                      onUpdateTaskStatus={handleUpdateTaskStatus}
                      onUpdateTask={handleUpdateTask}
                    />
                  ) : (
                    <div className="text-center py-16 text-muted-foreground">
                      <div className="flex justify-center mb-6">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-xl bg-muted/30 flex items-center justify-center">
                            <div className="grid grid-cols-2 gap-1">
                              <div className="w-2 h-2 rounded-sm bg-primary/60"></div>
                              <div className="w-2 h-2 rounded-sm bg-muted-foreground/40"></div>
                              <div className="w-2 h-2 rounded-sm bg-muted-foreground/40"></div>
                              <div className="w-2 h-2 rounded-sm bg-muted-foreground/40"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <h3 className="text-lg font-medium mb-2 text-foreground">No tasks yet</h3>
                      <p className="text-sm">Add tasks to get started. ✨</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: Quick Tasks Panel (30% width) */}
            <div className="lg:w-[30%] lg:min-w-[320px]">
              <Card className="glassmorphic border-muted/30 sticky top-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    ⚡ Quick Tasks
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Quick capture for triage</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {quickTasks.length > 0 ? (
                    quickTasks.map((task) => (
                      <div
                        key={task.id}
                        className="rounded-xl p-4 bg-muted/30 backdrop-blur border border-muted/30 hover:bg-muted/40 hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer"
                      >
                        <div className="font-medium text-sm leading-tight text-foreground">
                          {task.content}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompleteTask(task.id);
                            }}
                            className="h-6 px-2 text-xs"
                          >
                            Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task.id);
                            }}
                            className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="text-2xl mb-2">⚡</div>
                      <p className="text-sm">No quick tasks yet</p>
                      <p className="text-xs mt-1">Tasks added above will appear here for triage</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
