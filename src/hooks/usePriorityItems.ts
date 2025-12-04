import { useMemo } from 'react';
import { useTasks, Task } from '@/hooks/useTasks';
import { useDashboardPortfolioCompanies, DashboardPortfolioCompany } from '@/hooks/useDashboardPortfolioCompanies';
import { differenceInDays, differenceInHours, isToday, isPast, parseISO, startOfDay } from 'date-fns';

export type PriorityType = 'overdue' | 'due_today' | 'stale' | 'fresh';

export interface PriorityItem {
  id: string;
  type: PriorityType;
  companyId: string;
  companyName: string;
  companyLogo?: string | null;
  title: string;
  description: string;
  timestamp: string;
  entityType: 'portfolio' | 'pipeline';
}

export function usePriorityItems() {
  const { tasks } = useTasks();
  const { companies: portfolioCompanies, loading } = useDashboardPortfolioCompanies();

  const priorityItems = useMemo(() => {
    const items: PriorityItem[] = [];
    const now = new Date();

    // Get tasks linked to companies
    const companyTasks = tasks.filter(task => task.company_id && !task.completed);
    
    // Create a map of company IDs to company data
    const companyMap = new Map<string, DashboardPortfolioCompany>();
    portfolioCompanies.forEach(company => {
      companyMap.set(company.id, company);
    });

    // 1. Overdue tasks linked to companies
    companyTasks.forEach(task => {
      if (task.scheduledFor) {
        const dueDate = parseISO(task.scheduledFor);
        if (isPast(startOfDay(dueDate)) && !isToday(dueDate)) {
          const company = companyMap.get(task.company_id!);
          if (company) {
            items.push({
              id: `overdue-${task.id}`,
              type: 'overdue',
              companyId: company.id,
              companyName: company.name,
              companyLogo: company.logo_url,
              title: 'Overdue task',
              description: task.content,
              timestamp: task.scheduledFor,
              entityType: 'portfolio',
            });
          }
        }
      }
    });

    // 2. Tasks due today linked to companies
    companyTasks.forEach(task => {
      if (task.scheduledFor && isToday(parseISO(task.scheduledFor))) {
        const company = companyMap.get(task.company_id!);
        if (company) {
          items.push({
            id: `today-${task.id}`,
            type: 'due_today',
            companyId: company.id,
            companyName: company.name,
            companyLogo: company.logo_url,
            title: 'Due today',
            description: task.content,
            timestamp: task.scheduledFor,
            entityType: 'portfolio',
          });
        }
      }
    });

    // 3. Stale companies (>14 days without interaction)
    portfolioCompanies.forEach(company => {
      if (company.last_interaction_at) {
        const daysSinceInteraction = differenceInDays(now, parseISO(company.last_interaction_at));
        if (daysSinceInteraction > 14) {
          items.push({
            id: `stale-${company.id}`,
            type: 'stale',
            companyId: company.id,
            companyName: company.name,
            companyLogo: company.logo_url,
            title: 'Needs attention',
            description: `No contact in ${daysSinceInteraction} days`,
            timestamp: company.last_interaction_at,
            entityType: 'portfolio',
          });
        }
      } else {
        // No interactions ever
        items.push({
          id: `stale-${company.id}`,
          type: 'stale',
          companyId: company.id,
          companyName: company.name,
          companyLogo: company.logo_url,
          title: 'Needs attention',
          description: 'No recorded interactions',
          timestamp: '',
          entityType: 'portfolio',
        });
      }
    });

    // 4. Fresh activity (<48h interaction)
    portfolioCompanies.forEach(company => {
      if (company.last_interaction_at) {
        const hoursSinceInteraction = differenceInHours(now, parseISO(company.last_interaction_at));
        if (hoursSinceInteraction <= 48) {
          items.push({
            id: `fresh-${company.id}`,
            type: 'fresh',
            companyId: company.id,
            companyName: company.name,
            companyLogo: company.logo_url,
            title: 'Recent activity',
            description: 'Follow up while fresh',
            timestamp: company.last_interaction_at,
            entityType: 'portfolio',
          });
        }
      }
    });

    // Sort by priority: overdue > due_today > stale > fresh
    const priorityOrder: Record<PriorityType, number> = {
      overdue: 0,
      due_today: 1,
      stale: 2,
      fresh: 3,
    };

    return items
      .sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type])
      .slice(0, 6);
  }, [tasks, portfolioCompanies]);

  return { priorityItems, loading };
}
