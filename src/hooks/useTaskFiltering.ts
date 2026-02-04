
import { useMemo } from 'react';
import { Task } from './useTasks';
import { Category } from './useCategories';
import { Database } from '@/integrations/supabase/types';
import { parseISO, differenceInDays, isToday, isPast } from 'date-fns';

type Project = Database['public']['Tables']['projects']['Row'];

interface FilterOptions {
  statusFilter: string;
  priorityFilter: string;
  categoryFilter: string;
  projectFilter: string;
  sortBy: string;
  categories: Category[];
  projects: Project[];
  excludeInbox?: boolean;
  showArchived?: boolean;
}

function isWithinWeek(dateString: string): boolean {
  const date = parseISO(dateString);
  const now = new Date();
  const diff = differenceInDays(date, now);
  return diff >= -1 && diff <= 7;
}

export function useTaskFiltering(tasks: Task[], filters: FilterOptions) {
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...tasks];

    // By default, exclude inbox tasks from regular views
    if (filters.excludeInbox !== false) {
      filtered = filtered.filter(task => !task.inbox);
    }

    // Filter by status
    if (filters.statusFilter && filters.statusFilter !== 'all') {
      if (filters.statusFilter === 'ready') {
        // Ready to Work: high/medium priority OR due soon, not completed
        filtered = filtered.filter(task => {
          const isHighPriority = task.priority === 'high' || task.priority === 'medium';
          const isDueSoon = task.scheduledFor && isWithinWeek(task.scheduledFor);
          const isNotDone = task.status !== 'done' && !task.completed;
          return (isHighPriority || isDueSoon) && isNotDone;
        });
      } else if (filters.statusFilter === 'todo') {
        filtered = filtered.filter(task => task.status === 'todo');
      } else if (filters.statusFilter === 'progress') {
        filtered = filtered.filter(task => task.status === 'inprogress');
      } else if (filters.statusFilter === 'done') {
        filtered = filtered.filter(task => task.status === 'done');
      }
    }

    // Filter by priority
    if (filters.priorityFilter && filters.priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === filters.priorityFilter);
    }

    // Filter by category
    if (filters.categoryFilter && filters.categoryFilter !== 'all') {
      filtered = filtered.filter(task => task.category === filters.categoryFilter);
    }

    // Filter by project
    if (filters.projectFilter && filters.projectFilter !== 'all') {
      filtered = filtered.filter(task => task.project?.name === filters.projectFilter);
    }

    // Sort tasks
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        switch (filters.sortBy) {
          case 'priority':
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
            const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
            return bPriority - aPriority;
          
          case 'project':
            const aProject = a.project?.name || '';
            const bProject = b.project?.name || '';
            return aProject.localeCompare(bProject);
          
          case 'status':
            const statusOrder = { 'todo': 1, 'inprogress': 2, 'done': 3 };
            const aStatus = statusOrder[a.status as keyof typeof statusOrder] || 0;
            const bStatus = statusOrder[b.status as keyof typeof statusOrder] || 0;
            return aStatus - bStatus;
          
          case 'date':
          default:
            return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
        }
      });
    }

    return filtered;
  }, [tasks, filters]);

  return filteredAndSortedTasks;
}
