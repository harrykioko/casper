
import { useState } from "react";
import { TaskInput } from "@/components/dashboard/TaskInput";
import { TaskList, Task } from "@/components/dashboard/TaskList";
import { CalendarView } from "@/components/dashboard/CalendarView";
import { ReadingList, ReadingItem } from "@/components/dashboard/ReadingList";
import { CommandModal } from "@/components/modals/CommandModal";
import { Command, ListFilter, Calendar as CalendarIcon, Columns } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TodayCalendar } from "@/components/dashboard/TodayCalendar";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";

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

type ViewMode = "list" | "kanban";

export default function Dashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [readingItems, setReadingItems] = useState<ReadingItem[]>(mockReadingItems);
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  
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

  // Toggle between list and kanban views
  const toggleViewMode = (mode: ViewMode) => {
    setViewMode(mode);
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
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-zinc-800 dark:text-white/90">Dashboard</h1>
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

            {/* Task Entry */}
            <div className="mb-6">
              <TaskInput onAddTask={handleAddTask} />
            </div>

            {/* View Mode Toggle */}
            <div className="flex justify-end items-center mb-4 gap-2">
              <span className="text-sm text-zinc-500 dark:text-white/60 mr-2">View:</span>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                className={`h-8 w-8 p-0 ${viewMode === "list" ? 'bg-gradient-to-r from-[#FF6A79] to-[#415AFF] hover:from-[#FF6A79] hover:to-[#415AFF]' : ''}`}
                onClick={() => toggleViewMode("list")}
              >
                <ListFilter className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "kanban" ? "default" : "outline"}
                size="sm"
                className={`h-8 w-8 p-0 ${viewMode === "kanban" ? 'bg-gradient-to-r from-[#FF6A79] to-[#415AFF] hover:from-[#FF6A79] hover:to-[#415AFF]' : ''}`}
                onClick={() => toggleViewMode("kanban")}
              >
                <Columns className="h-4 w-4" />
              </Button>
            </div>

            {/* Task Display (List or Kanban) */}
            <div className="mb-8">
              {viewMode === "list" ? (
                <TaskList 
                  tasks={tasks} 
                  onTaskComplete={handleCompleteTask} 
                  onTaskDelete={handleDeleteTask} 
                />
              ) : (
                <KanbanView 
                  tasks={tasks} 
                  onTaskComplete={handleCompleteTask} 
                  onTaskDelete={handleDeleteTask} 
                />
              )}
            </div>

            {/* Reading List Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="section-title">Reading List</h2>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-xs font-medium h-7 px-3 hover:text-[#FF6A79]"
                >
                  + Add Link
                </Button>
              </div>
              <div className="max-h-[500px] overflow-auto pr-2">
                <ReadingList 
                  items={readingItems.slice(0, 3)} 
                  onMarkRead={handleMarkRead}
                  onDelete={handleDeleteReadingItem}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Sidebar - Calendar and Upcoming */}
        <div className="w-80 border-l border-white/10 p-6 overflow-y-auto h-screen sticky top-0 glassmorphic">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="section-title flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-zinc-400 dark:text-white/60" /> 
                Today
              </h2>
            </div>
            <TodayCalendar events={mockEvents.filter(event => {
              const today = new Date("2025-05-22");
              const eventDate = new Date(event.startTime);
              return eventDate.toDateString() === today.toDateString();
            })} />
          </div>
          
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="section-title">Upcoming</h2>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <UpcomingEvents events={mockEvents.filter(event => {
              const today = new Date("2025-05-22");
              const eventDate = new Date(event.startTime);
              return eventDate.toDateString() !== today.toDateString();
            })} />
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

// Kanban View Component
function KanbanView({ 
  tasks, 
  onTaskComplete, 
  onTaskDelete 
}: { 
  tasks: Task[]; 
  onTaskComplete: (id: string) => void; 
  onTaskDelete: (id: string) => void; 
}) {
  // Group tasks by status
  const todoTasks = tasks.filter(task => !task.completed);
  const doneTasks = tasks.filter(task => task.completed);
  const inProgressTasks: Task[] = []; // In a real app, you'd have an in-progress state

  const columns = [
    { title: "To Do", tasks: todoTasks },
    { title: "In Progress", tasks: inProgressTasks },
    { title: "Done", tasks: doneTasks }
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {columns.map((column) => (
        <div key={column.title} className="flex flex-col glassmorphic rounded-lg p-4">
          <h3 className="font-medium mb-3 text-zinc-800 dark:text-white/90">{column.title}</h3>
          <div className="flex-1 overflow-auto">
            {column.tasks.length > 0 ? (
              <div className="space-y-2">
                {column.tasks.map(task => (
                  <motion.div
                    key={task.id}
                    className="p-3 rounded-md glassmorphic"
                    whileHover={{ scale: 1.02 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex">
                      <div className="flex-1">
                        <p className="text-sm text-zinc-800 dark:text-white/90">{task.content}</p>
                        {task.project && (
                          <div className="flex items-center mt-2">
                            <div 
                              className="w-2 h-2 rounded-full mr-1"
                              style={{ backgroundColor: task.project.color }}
                            />
                            <span className="text-xs text-zinc-500 dark:text-white/60">{task.project.name}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onTaskComplete(task.id)}
                          className="h-6 w-6 rounded-full"
                        >
                          <span className="sr-only">Toggle completion</span>
                          <div className={`w-4 h-4 rounded-full border ${task.completed ? 'bg-primary border-primary' : 'border-zinc-400 dark:border-white/60'}`} />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 text-sm text-zinc-500 dark:text-white/60">
                No tasks
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
