
import { Task } from "@/components/dashboard/TaskSection";
import { ReadingItem } from "@/components/dashboard/ReadingList";

// Mock tasks data for the initial view
export const mockTasks: Task[] = [
  {
    id: "1",
    content: "Complete Casper MVP design",
    completed: false,
    status: "todo",
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
    status: "done",
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
    status: "todo",
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
    status: "todo",
    project: {
      id: "p2",
      name: "Research",
      color: "#2B2DFF"
    }
  }
];

// Mock events data
export const mockEvents = [
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

// Mock reading items data
export const mockReadingItems: ReadingItem[] = [
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
