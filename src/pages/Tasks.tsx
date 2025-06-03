
import { useState } from "react";
import { Plus, List, Columns, Check, Trash2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Mock data for the triage panel
const mockTriageTasks = [
  { id: 1, title: "Review project proposal", timeLeft: 45 },
  { id: 2, title: "Send follow-up email", timeLeft: 120 },
  { id: 3, title: "Update documentation", timeLeft: 200 },
  { id: 4, title: "Schedule team meeting", timeLeft: 320 },
];

export default function Tasks() {
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [newTask, setNewTask] = useState("");

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      console.log("Adding task:", newTask);
      setNewTask("");
    }
  };

  const getTimeLeftProgress = (minutes: number) => {
    const totalMinutes = 24 * 60; // 24 hours
    return Math.max(0, (minutes / totalMinutes) * 100);
  };

  const formatTimeLeft = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="min-h-screen p-6">
      {/* Top-level glassmorphic container */}
      <div className="max-w-7xl mx-auto">
        <div className="glassmorphic rounded-xl p-6 space-y-6">
          {/* Quick Add Input Bar */}
          <form onSubmit={handleAddTask} className="w-full">
            <div className="relative flex items-center gap-3 p-3 rounded-xl glassmorphic hover:ring-1 hover:ring-white/20 transition-all">
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="rounded-full h-8 w-8 flex-shrink-0 text-primary hover:bg-primary/10"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Input
                type="text"
                placeholder="Add a new task..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none text-base placeholder:text-muted-foreground"
              />
            </div>
          </form>

          {/* Main Content Area */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Main Workspace (70% width) */}
            <div className="flex-1 lg:w-[70%] space-y-4">
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "list" | "kanban")}>
                <TabsList className="glassmorphic">
                  <TabsTrigger value="list" className="flex items-center gap-2">
                    <List className="h-4 w-4" />
                    List View
                  </TabsTrigger>
                  <TabsTrigger value="kanban" className="flex items-center gap-2">
                    <Columns className="h-4 w-4" />
                    Kanban View
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="mt-4">
                  <Card className="glassmorphic border-muted/30">
                    <CardContent className="p-6">
                      <div className="text-center py-12 text-muted-foreground">
                        <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">Task List View</p>
                        <p className="text-sm">Your tasks will appear here in a clean list format</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="kanban" className="mt-4">
                  <Card className="glassmorphic border-muted/30">
                    <CardContent className="p-6">
                      <div className="text-center py-12 text-muted-foreground">
                        <Columns className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">Kanban Board View</p>
                        <p className="text-sm">Drag and drop your tasks across different columns</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right: Triage Panel (30% width) */}
            <div className="lg:w-[30%] lg:min-w-[320px]">
              <Card className="glassmorphic border-muted/30 sticky top-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    ⚡ Quick Tasks
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      Auto-expire at midnight
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockTriageTasks.map((task) => (
                    <div
                      key={task.id}
                      className="glassmorphic rounded-lg p-3 space-y-2 hover:bg-muted/40 transition-colors"
                    >
                      {/* Task Title */}
                      <div className="font-medium text-sm leading-tight">
                        {task.title}
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>Time left: {formatTimeLeft(task.timeLeft)}</span>
                          <span>{Math.round(getTimeLeftProgress(task.timeLeft))}%</span>
                        </div>
                        <div className="w-full bg-muted/30 rounded-full h-1.5">
                          <div
                            className={cn(
                              "h-1.5 rounded-full transition-all duration-300",
                              task.timeLeft < 60 ? "bg-destructive" :
                              task.timeLeft < 180 ? "bg-orange-500" :
                              "bg-primary"
                            )}
                            style={{ width: `${getTimeLeftProgress(task.timeLeft)}%` }}
                          />
                        </div>
                      </div>

                      {/* Action Icons */}
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-full text-green-600 hover:bg-green-600/10"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-full text-blue-600 hover:bg-blue-600/10"
                        >
                          <Wrench className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-full text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Empty State */}
                  {mockTriageTasks.length === 0 && (
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
    </div>
  );
}
