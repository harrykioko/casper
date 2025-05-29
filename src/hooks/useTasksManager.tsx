import { useTasks } from './useTasks';

export function useTasksManager() {
  const { tasks, createTask, updateTask, deleteTask } = useTasks();
  
  const handleAddTask = (content: string) => {
    createTask({ content });
  };
  
  const handleCompleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      updateTask(id, { 
        completed: !task.completed,
        status: !task.completed ? 'done' : 'todo'
      });
    }
  };
  
  const handleDeleteTask = (id: string) => {
    deleteTask(id);
  };

  const handleUpdateTaskStatus = (id: string, status: "todo" | "inprogress" | "done") => {
    updateTask(id, { 
      status,
      completed: status === 'done'
    });
  };

  const handleUpdateTask = (updatedTask: any) => {
    updateTask(updatedTask.id, updatedTask);
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
