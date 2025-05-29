
import { useState } from "react";
import { Task } from "@/hooks/useTasks";
import { v4 as uuidv4 } from "uuid";

interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  context: string;
}

interface Prompt {
  id: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
}

interface Link {
  id: string;
  title: string;
  url: string;
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

// Mock prompts with new structure
const mockPrompts: Prompt[] = [
  {
    id: "pr1",
    title: "Casper UI Component",
    description: "Create a new shadcn component for Casper with glassmorphic styling",
    content: "Create a new shadcn component for Casper with glassmorphic styling. The component should use backdrop-blur effects and translucent backgrounds...",
    tags: ["ui", "react", "shadcn"]
  },
  {
    id: "pr2",
    title: "Supabase Schema Design",
    description: "Design a schema for Casper with tables for users, tasks, projects",
    content: "Design a schema for Casper with tables for users, tasks, projects, and prompts. Include proper relationships and RLS policies...",
    tags: ["database", "supabase", "schema"]
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

export function useProjectDetail() {
  const [project, setProject] = useState<Project>(mockProject);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [prompts, setPrompts] = useState<Prompt[]>(mockPrompts);
  const [links, setLinks] = useState<Link[]>(mockLinks);
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  const [isCreatePromptModalOpen, setIsCreatePromptModalOpen] = useState(false);
  
  const openCommandModal = () => setIsCommandModalOpen(true);
  const closeCommandModal = () => setIsCommandModalOpen(false);
  
  const openCreatePromptModal = () => setIsCreatePromptModalOpen(true);
  const closeCreatePromptModal = () => setIsCreatePromptModalOpen(false);
  
  const updateProjectContext = (newContext: string) => {
    setProject(prev => ({ ...prev, context: newContext }));
  };
  
  const addTask = (content: string) => {
    const newTask: Task = {
      id: uuidv4(),
      content,
      completed: false,
      priority: "medium",
      scheduledFor: "Today"
    };
    setTasks(prev => [newTask, ...prev]);
  };
  
  const addPrompt = (prompt: Omit<Prompt, 'id'>) => {
    const newPrompt: Prompt = {
      id: uuidv4(),
      ...prompt
    };
    setPrompts(prev => [newPrompt, ...prev]);
  };
  
  const addLink = (link: { title: string, url: string }) => {
    const newLink: Link = {
      id: uuidv4(),
      title: link.title,
      url: link.url
    };
    setLinks(prev => [newLink, ...prev]);
  };
  
  const removeLink = (id: string) => {
    setLinks(prev => prev.filter(link => link.id !== id));
  };
  
  return {
    project,
    tasks,
    prompts,
    links,
    isCommandModalOpen,
    isCreatePromptModalOpen,
    openCommandModal,
    closeCommandModal,
    openCreatePromptModal,
    closeCreatePromptModal,
    updateProjectContext,
    addTask,
    addPrompt,
    addLink,
    removeLink
  };
}
