
import { useState } from "react";
import { Task } from "@/components/dashboard/TaskSection";
import { mockTasks } from "@/data/mockData";

export function useTasksManager() {
  const [tasks, setTasks] = useState<Task[]>(
    // Initialize with status field if not already present
    mockTasks.map(task => ({
      ...task,
      status: task.status || (task.completed ? "done" : "todo")
    }))
  );
  
  const handleAddTask = (content: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      content,
      completed: false,
      status: "todo"
    };
    setTasks([newTask, ...tasks]);
  };
  
  const handleCompleteTask = (id: string) => {
    setTasks(tasks.map(task => {
      if (task.id === id) {
        const completed = !task.completed;
        return {
          ...task,
          completed,
          status: completed ? "done" : task.status === "done" ? "todo" : task.status
        };
      }
      return task;
    }));
  };
  
  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const handleUpdateTaskStatus = (id: string, status: "todo" | "inprogress" | "done") => {
    setTasks(tasks.map(task => {
      if (task.id === id) {
        // Ensure completed state is synchronized with status
        const completed = status === "done";
        return {
          ...task,
          status,
          completed
        };
      }
      return task;
    }));
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(tasks.map(task => {
      if (task.id === updatedTask.id) {
        return updatedTask;
      }
      return task;
    }));
  };

  return {
    tasks,
    handleAddTask,
    handleCompleteTask,
    handleDeleteTask,
    handleUpdateTaskStatus,
    handleUpdateTask
  };
}
