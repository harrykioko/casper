
import { useNavigate } from "react-router-dom";
import { Task } from "@/hooks/useTasks";
import { ReadingItem } from "@/types/readingItem";

interface UseDashboardHandlersProps {
  tasks: Task[];
  createTask: (data: any) => Promise<void>;
  updateTask: (id: string, data: any) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  readingItems: ReadingItem[];
  createReadingItem: (data: any) => Promise<void>;
  updateReadingItem: (id: string, data: any) => Promise<void>;
  deleteReadingItem: (id: string) => Promise<void>;
}

export function useDashboardHandlers({
  tasks,
  createTask,
  updateTask,
  deleteTask,
  readingItems,
  createReadingItem,
  updateReadingItem,
  deleteReadingItem,
}: UseDashboardHandlersProps) {
  const navigate = useNavigate();

  // Handle navigation to prompts page for new prompt
  const handleAddPrompt = () => {
    navigate('/prompts', { state: { openNewPrompt: true } });
  };

  // Handle project creation
  const handleCreateProject = (data: any) => {
    console.log('Creating project from dashboard:', data);
    navigate('/projects');
  };

  // Task handlers
  const handleAddTask = async (content: string) => {
    try {
      await createTask({ content });
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleCompleteTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      try {
        await updateTask(id, { 
          completed: !task.completed,
          status: !task.completed ? 'done' : 'todo'
        });
      } catch (error) {
        console.error('Failed to update task:', error);
      }
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask(id);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleUpdateTaskStatus = async (id: string, status: "todo" | "inprogress" | "done") => {
    try {
      await updateTask(id, { 
        status,
        completed: status === 'done'
      });
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleUpdateTask = async (updatedTask: any) => {
    try {
      await updateTask(updatedTask.id, updatedTask);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  // Reading list handlers
  const handleMarkRead = async (id: string) => {
    const item = readingItems.find(item => item.id === id);
    if (item) {
      try {
        await updateReadingItem(id, { is_read: !item.isRead });
      } catch (error) {
        console.error('Failed to update reading item:', error);
      }
    }
  };

  const handleDeleteReadingItem = async (id: string) => {
    try {
      await deleteReadingItem(id);
    } catch (error) {
      console.error('Failed to delete reading item:', error);
    }
  };

  const handleAddReadingItem = async (itemData: any) => {
    try {
      await createReadingItem(itemData);
    } catch (error) {
      console.error('Failed to create reading item:', error);
    }
  };

  return {
    handleAddPrompt,
    handleCreateProject,
    handleAddTask,
    handleCompleteTask,
    handleDeleteTask,
    handleUpdateTaskStatus,
    handleUpdateTask,
    handleMarkRead,
    handleDeleteReadingItem,
    handleAddReadingItem,
  };
}
