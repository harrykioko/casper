
import { useState } from "react";
import { Task } from "@/components/dashboard/TaskList";
import { mockTasks } from "@/data/mockData";

export function useTasksManager() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  
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

  const handleUpdateTaskStatus = (id: string, completed: boolean) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed } : task
    ));
  };

  return {
    tasks,
    handleAddTask,
    handleCompleteTask,
    handleDeleteTask,
    handleUpdateTaskStatus
  };
}
