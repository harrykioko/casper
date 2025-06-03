
import { useState, useEffect } from "react";
import { Task } from "@/hooks/useTasks";

interface UseTaskDetailsProps {
  task: Task | null;
}

interface UseTaskDetailsReturn {
  content: string;
  setContent: (content: string) => void;
  status: "todo" | "inprogress" | "done";
  setStatus: (status: "todo" | "inprogress" | "done") => void;
  scheduledFor: Date | undefined;
  setScheduledFor: (date: Date | undefined) => void;
  selectedProject: Task["project"] | undefined;
  setSelectedProject: (project: Task["project"] | undefined) => void;
  priority: "low" | "medium" | "high" | undefined;
  setPriority: (priority: "low" | "medium" | "high" | undefined) => void;
  category: string | undefined;
  setCategory: (category: string | undefined) => void;
  resetForm: () => void;
  createUpdatedTask: () => Task | null;
}

export function useTaskDetails({ task }: UseTaskDetailsProps): UseTaskDetailsReturn {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"todo" | "inprogress" | "done">("todo");
  const [scheduledFor, setScheduledFor] = useState<Date | undefined>(undefined);
  const [selectedProject, setSelectedProject] = useState<Task["project"] | undefined>(undefined);
  const [priority, setPriority] = useState<"low" | "medium" | "high" | undefined>(undefined);
  const [category, setCategory] = useState<string | undefined>(undefined);
  
  // Initialize form when task changes
  useEffect(() => {
    if (task) {
      setContent(task.content);
      setStatus(task.status || "todo");
      setSelectedProject(task.project);
      setPriority(task.priority);
      setCategory(task.category);
      
      // Handle date parsing
      if (task.scheduledFor) {
        try {
          const date = new Date(task.scheduledFor);
          
          if (!isNaN(date.getTime())) {
            setScheduledFor(date);
          } else {
            setScheduledFor(undefined);
          }
        } catch (error) {
          console.error("Error parsing date:", error);
          setScheduledFor(undefined);
        }
      } else {
        setScheduledFor(undefined);
      }
    } else {
      // Reset form if no task is provided
      resetForm();
    }
  }, [task]);
  
  // Reset form to initial state
  const resetForm = () => {
    setContent("");
    setStatus("todo");
    setScheduledFor(undefined);
    setSelectedProject(undefined);
    setPriority(undefined);
    setCategory(undefined);
  };
  
  // Create an updated task object based on current form state
  const createUpdatedTask = (): Task | null => {
    if (!task) return null;
    
    return {
      ...task,
      content,
      status,
      completed: status === "done",
      project: selectedProject,
      priority,
      category,
      scheduledFor: scheduledFor ? scheduledFor.toISOString() : undefined,
      is_quick_task: false // Always convert to a regular task when edited
    };
  };
  
  return {
    content,
    setContent,
    status,
    setStatus,
    scheduledFor,
    setScheduledFor,
    selectedProject,
    setSelectedProject,
    priority,
    setPriority,
    category,
    setCategory,
    resetForm,
    createUpdatedTask
  };
}
