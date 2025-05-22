
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle, Copy, MessageSquareText, Link2 } from "lucide-react";
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
  
  return (
    <div 
      className="p-8 pl-24 min-h-screen"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => navigate("/projects")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <div 
                className="h-6 w-6 rounded-md" 
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
        
        {/* Project context */}
        <Card className="mb-6 glassmorphic">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Project Context</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={copyContextToClipboard}
              >
                <Copy className="h-4 w-4" />
              </Button>
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Project Tasks */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <CheckCircle className="mr-2 h-5 w-5" />
                Tasks
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
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/30 transition-colors"
                    >
                      <div className={`h-2 w-2 rounded-full ${
                        task.priority === "high" ? "bg-red-500" : 
                        task.priority === "medium" ? "bg-yellow-500" : "bg-green-500"
                      }`} />
                      <span 
                        className={`flex-1 ${task.completed ? "line-through text-muted-foreground" : ""}`}
                      >
                        {task.content}
                      </span>
                      {task.scheduledFor && (
                        <Badge variant="outline" className="text-xs">
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
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <MessageSquareText className="mr-2 h-5 w-5" />
                  Prompts
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
                        className="p-2 rounded-md hover:bg-accent/30 transition-colors cursor-pointer"
                      >
                        <h4 className="font-medium text-sm">{prompt.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {prompt.preview}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            
            {/* Project Links */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Link2 className="mr-2 h-5 w-5" />
                  Resources
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
                          className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/30 transition-colors text-sm"
                        >
                          <Link2 className="h-3.5 w-3.5" />
                          <span>{link.title}</span>
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
