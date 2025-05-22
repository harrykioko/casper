
import { useState } from "react";
import { TaskInput } from "@/components/dashboard/TaskInput";
import { TaskList, Task } from "@/components/dashboard/TaskList";
import { CalendarView } from "@/components/dashboard/CalendarView";
import { ReadingList, ReadingItem } from "@/components/dashboard/ReadingList";
import { CommandModal } from "@/components/modals/CommandModal";
import { Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

// Mock data for the initial view
const mockTasks: Task[] = [
  {
    id: "1",
    content: "Complete Casper MVP design",
    completed: false,
    project: {
      id: "p1",
      name: "Casper",
      color: "#FF1464"
    },
    priority: "high",
    scheduledFor: "Today"
  },
  {
    id: "2",
    content: "Review PRD document",
    completed: true,
    project: {
      id: "p1",
      name: "Casper",
      color: "#FF1464"
    },
    priority: "medium",
    scheduledFor: "Yesterday"
  },
  {
    id: "3",
    content: "Set up Supabase tables",
    completed: false,
    project: {
      id: "p1",
      name: "Casper",
      color: "#FF1464"
    },
    priority: "low",
    scheduledFor: "Tomorrow"
  },
  {
    id: "4",
    content: "Research Outlook API integration",
    completed: false,
    project: {
      id: "p2",
      name: "Research",
      color: "#2B2DFF"
    }
  }
];

const mockEvents = [
  {
    id: "e1",
    title: "Team Standup",
    startTime: "2025-05-22T09:00:00",
    endTime: "2025-05-22T09:30:00",
    location: "Zoom Meeting"
  },
  {
    id: "e2",
    title: "Design Review",
    startTime: "2025-05-22T11:00:00",
    endTime: "2025-05-22T12:00:00"
  },
  {
    id: "e3",
    title: "Lunch with Alex",
    startTime: "2025-05-22T13:00:00",
    endTime: "2025-05-22T14:00:00",
    location: "Cafe Nero"
  }
];

const mockReadingItems: ReadingItem[] = [
  {
    id: "r1",
    url: "https://ui.shadcn.com/",
    title: "shadcn/ui: Re-usable components built with Radix UI and Tailwind CSS",
    description: "Beautifully designed components that you can copy and paste into your apps.",
    favicon: "https://ui.shadcn.com/favicon.ico",
    isRead: false
  },
  {
    id: "r2",
    url: "https://tailwindcss.com/",
    title: "Tailwind CSS - Rapidly build modern websites without ever leaving your HTML",
    description: "A utility-first CSS framework packed with classes that can be composed to build any design, directly in your markup.",
    favicon: "https://tailwindcss.com/favicons/favicon.ico",
    isRead: true
  }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [readingItems, setReadingItems] = useState<ReadingItem[]>(mockReadingItems);
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  
  // Task handlers
  const handleAddTask = (content: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      content,
      completed: false
    };
    setTasks([newTask, ...tasks]);
  };
  
  const handleCompleteTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };
  
  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };
  
  // Reading list handlers
  const handleMarkRead = (id: string) => {
    setReadingItems(items => 
      items.map(item => 
        item.id === id ? { ...item, isRead: !item.isRead } : item
      )
    );
  };
  
  const handleDeleteReadingItem = (id: string) => {
    setReadingItems(items => items.filter(item => item.id !== id));
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
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button 
            variant="outline"
            className="glassmorphic gap-2"
            onClick={openCommandModal}
          >
            <Command className="h-4 w-4" />
            <span>Command</span>
            <kbd className="ml-2 text-xs bg-muted px-2 py-0.5 rounded">⌘K</kbd>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tasks Column */}
          <div className="lg:col-span-2 space-y-4">
            <TaskInput onAddTask={handleAddTask} />
            <TaskList 
              tasks={tasks} 
              onTaskComplete={handleCompleteTask} 
              onTaskDelete={handleDeleteTask} 
            />
          </div>
          
          {/* Calendar & Reading List Column */}
          <div className="space-y-6">
            <div className="h-[300px]">
              <CalendarView 
                events={mockEvents} 
                date={new Date("2025-05-22")}
              />
            </div>
            <div className="h-[300px]">
              <ReadingList 
                items={readingItems}
                onMarkRead={handleMarkRead}
                onDelete={handleDeleteReadingItem}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Command Modal */}
      <CommandModal 
        isOpen={isCommandModalOpen} 
        onClose={closeCommandModal} 
        onAddTask={handleAddTask}
        onNavigate={navigate}
      />
    </div>
  );
}
