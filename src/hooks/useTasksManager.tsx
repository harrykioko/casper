
import { useTasks } from './useTasks';

export function useTasksManager() {
  const { tasks, createTask, updateTask, deleteTask } = useTasks();
  
  const handleAddTask = (content: string, isQuickTask: boolean = false) => {
    createTask({ content, is_quick_task: isQuickTask });
  };
  
  const handleCompleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      updateTask(id, { 
        completed: !task.completed,
        status: !task.completed ? 'done' : 'todo',
        // Convert quick task to regular task when completed
        is_quick_task: task.completed ? task.is_quick_task : false
      });
    }
  };
  
  const handleDeleteTask = (id: string) => {
    deleteTask(id);
  };

  const handleUpdateTaskStatus = (id: string, status: "todo" | "inprogress" | "done") => {
    updateTask(id, { 
      status,
      completed: status === 'done',
      // Convert quick task to regular task when status is changed
      is_quick_task: false
    });
  };

  const handleUpdateTask = (updatedTask: any) => {
    // Convert quick task to regular task when edited
    updateTask(updatedTask.id, { ...updatedTask, is_quick_task: false });
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
