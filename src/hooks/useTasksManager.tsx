
import { useTasks, transformTaskForDatabase } from './useTasks';
import { useCategories } from './useCategories';

export function useTasksManager() {
  const { tasks, createTask, updateTask, deleteTask } = useTasks();
  const { getCategoryIdByName } = useCategories();
  
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
    // Get category_id from category name if category exists
    const categoryId = updatedTask.category ? getCategoryIdByName(updatedTask.category) : null;
    
    // Transform the frontend task object to database format
    const dbTaskData = transformTaskForDatabase({
      content: updatedTask.content,
      status: updatedTask.status,
      completed: updatedTask.completed,
      priority: updatedTask.priority,
      scheduledFor: updatedTask.scheduledFor,
      project_id: updatedTask.project?.id || null,
      category_id: categoryId,
      is_quick_task: false // Always convert to regular task when edited
    });

    // Remove the id from the update data since it's used in the WHERE clause
    const { id, ...updateData } = dbTaskData;
    
    updateTask(updatedTask.id, updateData);
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
