import { useState, useEffect, useRef } from "react";
import { Check, Calendar, FolderOpen, AlertCircle, MoreHorizontal, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Task } from "@/hooks/useTasks";
import { TaskCardContent } from "@/components/task-cards/TaskCardContent";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { useProjects } from "@/hooks/useProjects";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface InboxSectionProps {
  tasks: Task[];
  onInlineUpdate: (taskId: string, patch: Partial<Task>) => void;
  onBulkAction?: (ids: string[], action: string, value?: string | boolean) => void;
  onTaskComplete: (id: string) => void;
  onTaskClick: (task: Task) => void;
  onPromoteTask?: (id: string) => void;
}

export function InboxSection({
  tasks,
  onInlineUpdate,
  onBulkAction,
  onTaskComplete,
  onTaskClick,
  onPromoteTask
}: InboxSectionProps) {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { projects } = useProjects();

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!focusedTaskId) return;

      const currentIndex = tasks.findIndex(t => t.id === focusedTaskId);
      if (currentIndex === -1) return;

      switch (e.key) {
        case "ArrowUp":
        case "k":
          e.preventDefault();
          if (currentIndex > 0) {
            setFocusedTaskId(tasks[currentIndex - 1].id);
          }
          break;
        case "ArrowDown":
        case "j":
          e.preventDefault();
          if (currentIndex < tasks.length - 1) {
            setFocusedTaskId(tasks[currentIndex + 1].id);
          }
          break;
        case "t":
        case "T":
          e.preventDefault();
          onInlineUpdate(focusedTaskId, { 
            scheduledFor: new Date().toISOString().split('T')[0] 
          });
          break;
        case "!": {
          e.preventDefault();
          const task = tasks.find(t => t.id === focusedTaskId);
          if (task) {
            const priorities: ("low" | "medium" | "high")[] = ["low", "medium", "high"];
            const currentIndex = priorities.indexOf(task.priority || "low");
            const nextPriority = priorities[(currentIndex + 1) % 3];
            onInlineUpdate(focusedTaskId, { priority: nextPriority });
          }
          break;
        }
        case " ":
          e.preventDefault();
          onTaskComplete(focusedTaskId);
          break;
        case "Enter": {
          e.preventDefault();
          const taskToOpen = tasks.find(t => t.id === focusedTaskId);
          if (taskToOpen) {
            onTaskClick(taskToOpen);
          }
          break;
        }
        case "p":
        case "P": {
          e.preventDefault();
          // Open project picker for focused task
          const projectButton = document.querySelector(`[data-task-id="${focusedTaskId}"] [data-project-trigger]`) as HTMLElement;
          projectButton?.click();
          break;
        }
      }

      // Multi-select with Shift
      if (e.shiftKey && e.key === " ") {
        e.preventDefault();
        setSelectedTasks(prev => {
          const newSet = new Set(prev);
          if (newSet.has(focusedTaskId)) {
            newSet.delete(focusedTaskId);
          } else {
            newSet.add(focusedTaskId);
          }
          return newSet;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedTaskId, tasks, onInlineUpdate, onTaskComplete, onTaskClick]);

  const handleComplete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setShowConfetti(id);
    onTaskComplete(id);
    
    setTimeout(() => {
      setShowConfetti(null);
    }, 1000);
  };

  const handleBulkScheduleToday = () => {
    if (onBulkAction && selectedTasks.size > 0) {
      onBulkAction(
        Array.from(selectedTasks), 
        'schedule', 
        new Date().toISOString().split('T')[0]
      );
      setSelectedTasks(new Set());
    }
  };

  const handleBulkSetProject = (projectId: string) => {
    if (onBulkAction && selectedTasks.size > 0) {
      onBulkAction(Array.from(selectedTasks), 'project', projectId);
      setSelectedTasks(new Set());
    }
  };

  const handleBulkSetPriority = (priority: "low" | "medium" | "high") => {
    if (onBulkAction && selectedTasks.size > 0) {
      onBulkAction(Array.from(selectedTasks), 'priority', priority);
      setSelectedTasks(new Set());
    }
  };

  const handleBulkComplete = () => {
    if (onBulkAction && selectedTasks.size > 0) {
      onBulkAction(Array.from(selectedTasks), 'complete', true);
      setSelectedTasks(new Set());
    }
  };

  const getPriorityColor = (priority?: "low" | "medium" | "high") => {
    switch (priority) {
      case "high": return "text-red-500 bg-red-500/10 border-red-500/30";
      case "medium": return "text-orange-500 bg-orange-500/10 border-orange-500/30";
      case "low": return "text-gray-400 bg-gray-400/10 border-gray-400/30";
      default: return "text-muted-foreground bg-muted/30 border-muted/30";
    }
  };

  if (tasks.length === 0) {
    return (
      <Card className="glassmorphic border-muted/30">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            Triage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-2xl mb-2">🎯</div>
            <p className="text-sm">All clear. Add your next task above.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glassmorphic border-muted/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            Triage
            <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-full">
              {tasks.length}
            </span>
          </CardTitle>
          {selectedTasks.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedTasks.size} selected
              </span>
              <Button size="sm" variant="outline" onClick={handleBulkScheduleToday}>
                Schedule Today
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="outline">Set Project</Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search projects..." />
                    <CommandEmpty>No project found.</CommandEmpty>
                    <CommandGroup>
                      {projects.map((project) => (
                        <CommandItem
                          key={project.id}
                          onSelect={() => handleBulkSetProject(project.id)}
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: project.color }}
                            />
                            {project.name}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="outline">Set Priority</Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px]">
                  <ToggleGroup type="single" className="justify-start">
                    <ToggleGroupItem 
                      value="high" 
                      onClick={() => handleBulkSetPriority("high")}
                      className="text-red-500"
                    >
                      High
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                      value="medium" 
                      onClick={() => handleBulkSetPriority("medium")}
                      className="text-orange-500"
                    >
                      Medium
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                      value="low" 
                      onClick={() => handleBulkSetPriority("low")}
                      className="text-gray-400"
                    >
                      Low
                    </ToggleGroupItem>
                  </ToggleGroup>
                </PopoverContent>
              </Popover>
              <Button size="sm" variant="outline" onClick={handleBulkComplete}>
                Complete
              </Button>
              {onPromoteTask && (
                <Button size="sm" variant="outline" onClick={() => {
                  if (selectedTasks.size > 0) {
                    Array.from(selectedTasks).forEach(id => onPromoteTask(id));
                    setSelectedTasks(new Set());
                  }
                }}>
                  Promote
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent ref={containerRef} className="space-y-1">
        {tasks.map((task) => (
          <div
            key={task.id}
            data-task-id={task.id}
            className={cn(
              "group flex items-center gap-3 rounded-xl p-3 transition-all duration-200 cursor-pointer",
              "hover:bg-muted/40 hover:ring-1 hover:ring-muted/50",
              focusedTaskId === task.id && "ring-2 ring-primary/40 bg-muted/30",
              selectedTasks.has(task.id) && "bg-primary/5 ring-1 ring-primary/30"
            )}
            onClick={(e) => {
              if (e.shiftKey) {
                setSelectedTasks(prev => {
                  const newSet = new Set(prev);
                  if (newSet.has(task.id)) {
                    newSet.delete(task.id);
                  } else {
                    newSet.add(task.id);
                  }
                  return newSet;
                });
              } else {
                setFocusedTaskId(task.id);
                onTaskClick(task);
              }
            }}
          >
            {/* Checkbox */}
            <div className="relative">
              <Button
                size="icon"
                variant="outline"
                className="rounded-full h-6 w-6 border-2 border-muted-foreground/30"
                onClick={(e) => handleComplete(e, task.id)}
              >
                {task.completed && <Check className="h-3 w-3" />}
                {showConfetti === task.id && (
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(10)].map((_, i) => (
                      <span
                        key={i}
                        className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-gradient-primary animate-confetti"
                        style={{
                          animationDelay: `${i * 0.05}s`,
                          transform: `rotate(${i * 36}deg)`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1">
              <TaskCardContent 
                content={task.content} 
                completed={task.completed}
              />
            </div>

            {/* Inline Chips */}
            <div className="flex items-center gap-2">
              {/* Date Chip */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-7 px-2 text-xs rounded-md",
                      task.scheduledFor 
                        ? "text-primary bg-primary/10 hover:bg-primary/20" 
                        : "text-muted-foreground hover:bg-muted/50"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    {task.scheduledFor ? format(new Date(task.scheduledFor), "MMM d") : "Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    mode="single"
                    selected={task.scheduledFor ? new Date(task.scheduledFor) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        onInlineUpdate(task.id, { 
                          scheduledFor: format(date, 'yyyy-MM-dd')
                        });
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* Project Chip */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    data-project-trigger
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-7 px-2 text-xs rounded-md",
                      task.project 
                        ? "bg-muted/50 hover:bg-muted/70" 
                        : "text-muted-foreground hover:bg-muted/50"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FolderOpen className="h-3 w-3 mr-1" />
                    {task.project ? (
                      <span className="flex items-center gap-1">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: task.project.color }}
                        />
                        {task.project.name}
                      </span>
                    ) : (
                      "Project"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="end">
                  <Command>
                    <CommandInput placeholder="Search projects..." />
                    <CommandEmpty>No project found.</CommandEmpty>
                    <CommandGroup>
                      {projects.map((project) => (
                        <CommandItem
                          key={project.id}
                          onSelect={() => {
                            onInlineUpdate(task.id, { 
                              project_id: project.id,
                              project: {
                                id: project.id,
                                name: project.name,
                                color: project.color
                              }
                            });
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: project.color }}
                            />
                            {project.name}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Priority Chip */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-7 px-2 text-xs rounded-md border",
                      getPriorityColor(task.priority)
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : "Priority"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px]" align="end">
                  <ToggleGroup 
                    type="single" 
                    value={task.priority || ""} 
                    onValueChange={(value) => {
                      if (value) {
                        onInlineUpdate(task.id, { 
                          priority: value as "low" | "medium" | "high" 
                        });
                      }
                    }}
                    className="justify-start"
                  >
                    <ToggleGroupItem value="high" className="text-red-500">
                      High
                    </ToggleGroupItem>
                    <ToggleGroupItem value="medium" className="text-orange-500">
                      Medium
                    </ToggleGroupItem>
                    <ToggleGroupItem value="low" className="text-gray-400">
                      Low
                    </ToggleGroupItem>
                  </ToggleGroup>
                </PopoverContent>
              </Popover>

              {/* Promote out of triage */}
              {onPromoteTask && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPromoteTask(task.id);
                  }}
                  title="Promote to main task list"
                >
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  Promote
                </Button>
              )}

              {/* More Options */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onTaskClick(task);
                }}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}