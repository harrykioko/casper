
import { useState, useEffect, useRef } from "react";
import { Plus, List, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Mock data for the quick tasks panel
const mockQuickTasks = [
  { id: 1, title: "Review project proposal", completion: 75, urgency: "high" },
  { id: 2, title: "Send follow-up email", completion: 25, urgency: "medium" },
  { id: 3, title: "Update documentation", completion: 90, urgency: "low" },
  { id: 4, title: "Schedule team meeting", completion: 50, urgency: "medium" },
];

export default function Tasks() {
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [newTask, setNewTask] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on page load
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      console.log("Adding task:", newTask);
      setNewTask("");
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high": return "bg-red-500";
      case "medium": return "bg-orange-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-400";
    }
  };

  const handleQuickTaskClick = (taskId: number) => {
    console.log("Opening task details for:", taskId);
    // Future: open details modal
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Quick Add Input Bar */}
        <form onSubmit={handleAddTask} className="w-full">
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
              placeholder="Add a task… (press Tab to enrich)"
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
            onClick={() => setViewMode("list")}
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
          <Button
            variant={viewMode === "kanban" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("kanban")}
            className={cn(
              "flex items-center gap-2 rounded-full transition-all",
              viewMode === "kanban" 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
            Kanban View
          </Button>
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Main Workspace (70% width) */}
          <div className="flex-1 lg:w-[70%]">
            <Card className="glassmorphic border-muted/30">
              <CardContent className="p-8">
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
                  <h3 className="text-lg font-medium mb-2 text-foreground">You're all set</h3>
                  <p className="text-sm">Add tasks to get started. ✨</p>
                </div>
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
              </CardHeader>
              <CardContent className="space-y-3">
                {mockQuickTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleQuickTaskClick(task.id)}
                    className="rounded-xl p-3 bg-muted/30 backdrop-blur border border-muted/30 hover:bg-muted/40 hover:shadow-sm transition-all duration-200 cursor-pointer group"
                  >
                    {/* Task Header */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="font-medium text-sm leading-tight flex-1">
                        {task.title}
                      </div>
                      <div 
                        className={cn("w-2 h-2 rounded-full flex-shrink-0 mt-1", getUrgencyColor(task.urgency))}
                      />
                    </div>

                    {/* Completion Percentage */}
                    <div className="text-xs text-muted-foreground">
                      {task.completion}% complete
                    </div>
                  </div>
                ))}

                {/* Empty State */}
                {mockQuickTasks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="text-2xl mb-2">⚡</div>
                    <p className="text-sm">No quick tasks yet</p>
                    <p className="text-xs mt-1">Tasks added will appear here temporarily</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
