
import { useState } from "react";
import { Task } from "@/components/dashboard/TaskList";
import { CommandModal } from "@/components/modals/CommandModal";
import { ReadingItem } from "@/components/dashboard/ReadingList";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { TaskSection } from "@/components/dashboard/TaskSection";
import { ReadingListSection } from "@/components/dashboard/ReadingListSection";
import { CalendarSidebar } from "@/components/dashboard/CalendarSidebar";

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
    location: "Zoom Meeting",
    category: "work"
  },
  {
    id: "e2",
    title: "Design Review",
    startTime: "2025-05-22T11:00:00",
    endTime: "2025-05-22T12:00:00",
    category: "work"
  },
  {
    id: "e3",
    title: "Lunch with Alex",
    startTime: "2025-05-22T13:00:00",
    endTime: "2025-05-22T14:00:00",
    location: "Cafe Nero",
    category: "social"
  },
  {
    id: "e4",
    title: "Dentist Appointment",
    startTime: "2025-05-23T10:00:00",
    endTime: "2025-05-23T11:00:00",
    location: "Dental Clinic",
    category: "personal"
  },
  {
    id: "e5",
    title: "Product Planning",
    startTime: "2025-05-23T14:00:00",
    endTime: "2025-05-23T15:30:00",
    category: "work"
  },
  {
    id: "e6",
    title: "Dinner Party",
    startTime: "2025-05-24T19:00:00",
    endTime: "2025-05-24T22:00:00",
    location: "John's Place",
    category: "social"
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
  },
  {
    id: "r3",
    url: "https://framer.com/motion",
    title: "Framer Motion - Production-Ready Animation Library for React",
    description: "A simple and powerful React animation library that makes creating complex animations easy.",
    favicon: "https://framer.com/favicon.ico",
    isRead: false
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
      className="min-h-screen"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="flex">
        {/* Main Content Column */}
        <div className="flex-1 p-8">
          <div className="max-w-3xl mx-auto">
            {/* Header with Command Button */}
            <DashboardHeader openCommandModal={openCommandModal} />

            {/* Task Section */}
            <TaskSection
              tasks={tasks}
              onAddTask={handleAddTask}
              onTaskComplete={handleCompleteTask}
              onTaskDelete={handleDeleteTask}
            />

            {/* Reading List Section */}
            <ReadingListSection
              readingItems={readingItems}
              onMarkRead={handleMarkRead}
              onDeleteReadingItem={handleDeleteReadingItem}
            />
          </div>
        </div>
        
        {/* Right Sidebar - Calendar and Upcoming */}
        <CalendarSidebar events={mockEvents} />
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
