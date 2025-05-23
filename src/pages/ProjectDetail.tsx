
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle, Copy, MessageSquareText, Link2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardTitle, Card, CardHeader, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CommandModal } from "@/components/modals/CommandModal";
import { Task } from "@/components/dashboard/TaskList";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  context: string;
}

// Mock project detail
const mockProject: Project = {
  id: "p1",
  name: "Casper",
  description: "Personal task & project management command center",
  color: "#FF1464",
  context: "Casper is a desktop-first personal productivity command center that brings tasks, projects, calendar events, prompts, and reading materials into one sleek interface. The UI is inspired by modern tools like Linear and should feel fast and delightful to use. Key features include a Command+K modal for quick actions, glassmorphic UI elements, and a focus on keyboard-first navigation."
};

// Mock project tasks
const mockTasks: Task[] = [
  {
    id: "1",
    content: "Complete Casper MVP design",
    completed: false,
    priority: "high",
    scheduledFor: "Today"
  },
  {
    id: "2",
    content: "Review PRD document",
    completed: true,
    priority: "medium",
    scheduledFor: "Yesterday"
  },
  {
    id: "3",
    content: "Set up Supabase tables",
    completed: false,
    priority: "low",
    scheduledFor: "Tomorrow"
  }
];

// Mock prompts
const mockPrompts = [
  {
    id: "pr1",
    title: "Casper UI Component",
    preview: "Create a new shadcn component for Casper with glassmorphic styling..."
  },
  {
    id: "pr2",
    title: "Supabase Schema Design",
    preview: "Design a schema for Casper with tables for users, tasks, projects..."
  }
];

// Mock links
const mockLinks = [
  {
    id: "l1",
    title: "Casper PRD Document",
    url: "https://docs.example.com/casper-prd"
  },
  {
    id: "l2",
    title: "Design Inspiration Board",
    url: "https://figma.com/file/example"
  }
];

export default function ProjectDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [project] = useState<Project>(mockProject);
  const [tasks] = useState<Task[]>(mockTasks);
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  
  // Copy context to clipboard
  const copyContextToClipboard = () => {
    navigator.clipboard.writeText(project.context);
    toast({
      title: "Copied to clipboard",
      description: "Project context has been copied."
    });
  };
  
  // Command modal handling
  const openCommandModal = () => setIsCommandModalOpen(true);
  const closeCommandModal = () => setIsCommandModalOpen(false);
  
  // Handle keyboard shortcut for command modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      openCommandModal();
    }
  };
  
  const getBadgeColorForSchedule = (scheduledFor: string) => {
    if (scheduledFor === 'Today') return 'bg-indigo-500/10 text-indigo-500 border-indigo-200/50';
    if (scheduledFor === 'Yesterday') return 'bg-zinc-400/10 text-zinc-500 border-zinc-200/50';
    return 'bg-teal-500/10 text-teal-500 border-teal-200/50'; // Future
  };

  const getPriorityBorderColor = (priority: string) => {
    if (priority === 'high') return 'border-red-500';
    if (priority === 'medium') return 'border-yellow-500';
    return 'border-green-500'; // low
  };
  
  return (
    <div 
      className="p-8 pl-24 min-h-screen"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="max-w-7xl mx-auto">
        {/* Sticky header */}
        <div className="sticky top-0 z-30 w-full -mx-8 px-6 py-3 bg-white/60 dark:bg-zinc-900/50 backdrop-blur-sm border-b border-black/10 dark:border-white/10">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => navigate("/projects")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <div 
                  className="h-4 w-4 rounded-md" 
                  style={{ backgroundColor: project.color }}
                />
                {project.name}
              </h1>
            </div>
            <Button 
              variant="outline"
              className="glassmorphic"
              onClick={openCommandModal}
            >
              <span className="sr-only">Command</span>
              <kbd className="text-xs bg-muted px-2 py-0.5 rounded">⌘K</kbd>
            </Button>
          </div>
        </div>
        <div className="h-0.5 w-full -mx-8 mb-6" style={{ backgroundColor: project.color }}></div>
        
        {/* Project context */}
        <Card className="mb-6 glassmorphic relative group">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Project Context</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 transition active:scale-95"
                  onClick={copyContextToClipboard}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={project.context}
              readOnly
              className="resize-none bg-transparent border-none focus-visible:ring-0 h-32"
            />
          </CardContent>
        </Card>
        
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Project Tasks */}
          <Card className="lg:col-span-2 relative rounded-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-sm ring-1 ring-black/5 dark:ring-white/10 hover:shadow-md/10 transition group">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <CheckCircle className="mr-2 h-5 w-5" />
                Tasks
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    <Plus className="h-3.5 w-3.5" />
                    Task
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No tasks yet</p>
              ) : (
                <ul className="space-y-2">
                  {tasks.map(task => (
                    <li 
                      key={task.id}
                      className={`flex items-center gap-3 p-2 rounded-md hover:bg-accent/30 transition-colors border-l-4 pl-3 ${getPriorityBorderColor(task.priority)}`}
                    >
                      <span 
                        className={`flex-1 ${task.completed ? "line-through text-muted-foreground" : ""}`}
                      >
                        {task.content}
                      </span>
                      {task.scheduledFor && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getBadgeColorForSchedule(task.scheduledFor)}`}
                        >
                          {task.scheduledFor}
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          
          <div className="space-y-6">
            {/* Project Prompts */}
            <Card className="relative rounded-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-sm ring-1 ring-black/5 dark:ring-white/10 hover:shadow-md/10 transition hover:translate-y-[-2px] group">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <MessageSquareText className="mr-2 h-5 w-5" />
                  Prompts
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs">
                      <Plus className="h-3.5 w-3.5" />
                      Prompt
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mockPrompts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No prompts yet</p>
                ) : (
                  <ul className="space-y-2">
                    {mockPrompts.map(prompt => (
                      <li 
                        key={prompt.id}
                        className="p-3 rounded-md hover:bg-accent/30 transition-colors cursor-pointer flex items-start justify-between"
                      >
                        <div>
                          <h4 className="font-medium text-sm">{prompt.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {prompt.preview}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 mt-1 opacity-0 group-hover:opacity-100 hover:opacity-100 transition active:scale-95"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            
            {/* Project Links */}
            <Card className="relative rounded-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-sm ring-1 ring-black/5 dark:ring-white/10 hover:shadow-md/10 transition hover:translate-y-[-2px] group">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Link2 className="mr-2 h-5 w-5" />
                  Resources
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs">
                      <Plus className="h-3.5 w-3.5" />
                      Resource
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mockLinks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No links yet</p>
                ) : (
                  <ul className="space-y-2">
                    {mockLinks.map(link => (
                      <li key={link.id}>
                        <a 
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 rounded-md hover:bg-accent/30 transition-colors text-sm group/link"
                        >
                          <Link2 className="h-3.5 w-3.5 shrink-0" />
                          <span className="group-hover/link:underline">{link.title}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Command Modal */}
      <CommandModal 
        isOpen={isCommandModalOpen} 
        onClose={closeCommandModal}
        onNavigate={navigate}
      />
    </div>
  );
}
