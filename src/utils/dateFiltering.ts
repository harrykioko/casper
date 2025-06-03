
import { isToday, parseISO } from 'date-fns';

export function isTaskDueToday(scheduledFor?: string): boolean {
  if (!scheduledFor) return false;
  
  try {
    const date = typeof scheduledFor === 'string' ? parseISO(scheduledFor) : new Date(scheduledFor);
    return isToday(date);
  } catch (error) {
    return false;
  }
}

export function filterTodayTasks(tasks: any[], selectedCategory?: string) {
  return tasks.filter(task => {
    // Only show non-quick tasks that are due today
    const isDueToday = isTaskDueToday(task.scheduledFor);
    const isNotQuickTask = !task.is_quick_task;
    const matchesCategory = !selectedCategory || selectedCategory === 'all' || task.category === selectedCategory;
    
    return isDueToday && isNotQuickTask && matchesCategory;
  });
}
