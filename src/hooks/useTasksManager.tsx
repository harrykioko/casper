
import { useTasks, transformTaskForDatabase } from './useTasks';
import { useCategories } from './useCategories';

export function useTasksManager() {
  const { tasks, createTask, updateTask, deleteTask, getInboxTasks, getNonInboxTasks } = useTasks();
  const { getCategoryIdByName } = useCategories();
  
  const handleAddTask = (content: string) => {
    // All new tasks go to inbox by default
    createTask({ content, is_quick_task: true });
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

  const handlePromoteTask = (id: string) => {
    // Explicitly move a task out of triage into the main list
    updateTask(id, { is_quick_task: false });
  };

  const handleUpdateTaskStatus = (id: string, status: "todo" | "inprogress" | "done") => {
    updateTask(id, {
      status,
      completed: status === 'done'
      // DB trigger will set inbox = false when status !== 'todo'
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
      company_id: updatedTask.company_id || null,
      pipeline_company_id: updatedTask.pipeline_company_id || null,
      // DB trigger will handle inbox = false when scheduled_for or project_id is set
    });

    // Remove the id from the update data since it's used in the WHERE clause
    const { id, ...updateData } = dbTaskData;

    updateTask(updatedTask.id, updateData);
  };

  const quickInlineUpdate = (taskId: string, patch: Partial<any>) => {
    // Quick inline update for chips with optimistic updates
    const dbPatch = transformTaskForDatabase(patch);
    updateTask(taskId, dbPatch);
  };

  const bulkUpdate = (ids: string[], patch: Partial<any>) => {
    // Bulk update multiple tasks
    const dbPatch = transformTaskForDatabase(patch);
    ids.forEach(id => updateTask(id, dbPatch));
  };

  return {
    tasks,
    inboxTasks: getInboxTasks(),
    nonInboxTasks: getNonInboxTasks(),
    handleAddTask,
    handleCompleteTask,
    handleDeleteTask,
    handlePromoteTask,
    handleUpdateTaskStatus,
    handleUpdateTask,
    quickInlineUpdate,
    bulkUpdate
  };
}
