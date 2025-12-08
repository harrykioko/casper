/**
 * usePriorityItems Hook - Current Priority System
 *
 * This is the current priority system implementation (Phase 0).
 * It only surfaces priority items that are linked to companies (portfolio or pipeline).
 *
 * TODO: Replace with unified priority model in Phase 2/3
 * See docs/priority_system/01_current_state.md for analysis of current system
 * See docs/priority_system/02_proposed_model.md for unified priority design
 * See src/types/priority.ts for new PriorityItem interface
 *
 * Key limitations of current system:
 * - Only shows company-linked tasks (standalone tasks invisible)
 * - No inbox integration
 * - No calendar integration
 * - No reading list integration
 * - No nonnegotiables integration
 * - Simple 3-level priority (overdue > due_today > stale)
 * - Hard-coded 14-day staleness threshold
 * - Limited to 4 items
 * - No explainability (why is this prioritized?)
 *
 * Future: Will be replaced by useUnifiedPriority() hook
 */
import { useMemo } from 'react';
import { useTasks, Task } from '@/hooks/useTasks';
import { useDashboardPortfolioCompanies, DashboardPortfolioCompany } from '@/hooks/useDashboardPortfolioCompanies';
import { useDashboardPipelineFocus, DashboardPipelineCompany } from '@/hooks/useDashboardPipelineFocus';
import { differenceInDays, isToday, isPast, parseISO, startOfDay } from 'date-fns';

export type PriorityType = 'overdue' | 'due_today' | 'stale';

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
  const { companies: portfolioCompanies, loading: portfolioLoading } = useDashboardPortfolioCompanies();
  const { companies: pipelineCompanies, loading: pipelineLoading } = useDashboardPipelineFocus();

  const priorityItems = useMemo(() => {
    const items: PriorityItem[] = [];
    const now = new Date();

    // Create maps for quick lookup
    const portfolioMap = new Map<string, DashboardPortfolioCompany>();
    portfolioCompanies.forEach(company => {
      portfolioMap.set(company.id, company);
    });

    const pipelineMap = new Map<string, DashboardPipelineCompany>();
    pipelineCompanies.forEach(company => {
      pipelineMap.set(company.id, company);
    });

    // Get incomplete tasks linked to companies
    const portfolioTasks = tasks.filter(task => task.company_id && !task.completed);
    const pipelineTasks = tasks.filter(task => task.pipeline_company_id && !task.completed);

    // 1. Overdue portfolio tasks
    portfolioTasks.forEach(task => {
      if (task.scheduledFor) {
        const dueDate = parseISO(task.scheduledFor);
        if (isPast(startOfDay(dueDate)) && !isToday(dueDate)) {
          const company = portfolioMap.get(task.company_id!);
          if (company) {
            items.push({
              id: `overdue-portfolio-${task.id}`,
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

    // 2. Overdue pipeline tasks
    pipelineTasks.forEach(task => {
      if (task.scheduledFor) {
        const dueDate = parseISO(task.scheduledFor);
        if (isPast(startOfDay(dueDate)) && !isToday(dueDate)) {
          const company = pipelineMap.get(task.pipeline_company_id!);
          if (company) {
            items.push({
              id: `overdue-pipeline-${task.id}`,
              type: 'overdue',
              companyId: company.id,
              companyName: company.company_name,
              companyLogo: company.logo_url,
              title: 'Overdue task',
              description: task.content,
              timestamp: task.scheduledFor,
              entityType: 'pipeline',
            });
          }
        }
      }
    });

    // 3. Tasks due today - portfolio
    portfolioTasks.forEach(task => {
      if (task.scheduledFor && isToday(parseISO(task.scheduledFor))) {
        const company = portfolioMap.get(task.company_id!);
        if (company) {
          items.push({
            id: `today-portfolio-${task.id}`,
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

    // 4. Tasks due today - pipeline
    pipelineTasks.forEach(task => {
      if (task.scheduledFor && isToday(parseISO(task.scheduledFor))) {
        const company = pipelineMap.get(task.pipeline_company_id!);
        if (company) {
          items.push({
            id: `today-pipeline-${task.id}`,
            type: 'due_today',
            companyId: company.id,
            companyName: company.company_name,
            companyLogo: company.logo_url,
            title: 'Due today',
            description: task.content,
            timestamp: task.scheduledFor,
            entityType: 'pipeline',
          });
        }
      }
    });

    // 5. Stale portfolio companies (>14 days without interaction)
    portfolioCompanies.forEach(company => {
      if (company.last_interaction_at) {
        const daysSinceInteraction = differenceInDays(now, parseISO(company.last_interaction_at));
        if (daysSinceInteraction > 14) {
          items.push({
            id: `stale-portfolio-${company.id}`,
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
          id: `stale-portfolio-${company.id}`,
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

    // 6. Stale pipeline companies (>14 days without interaction)
    pipelineCompanies.forEach(company => {
      if (company.last_interaction_at) {
        const daysSinceInteraction = differenceInDays(now, parseISO(company.last_interaction_at));
        if (daysSinceInteraction > 14) {
          items.push({
            id: `stale-pipeline-${company.id}`,
            type: 'stale',
            companyId: company.id,
            companyName: company.company_name,
            companyLogo: company.logo_url,
            title: 'Needs attention',
            description: `No contact in ${daysSinceInteraction} days`,
            timestamp: company.last_interaction_at,
            entityType: 'pipeline',
          });
        }
      } else {
        // No interactions ever
        items.push({
          id: `stale-pipeline-${company.id}`,
          type: 'stale',
          companyId: company.id,
          companyName: company.company_name,
          companyLogo: company.logo_url,
          title: 'Needs attention',
          description: 'No recorded interactions',
          timestamp: '',
          entityType: 'pipeline',
        });
      }
    });

    // Sort by priority: overdue > due_today > stale
    const priorityOrder: Record<PriorityType, number> = {
      overdue: 0,
      due_today: 1,
      stale: 2,
    };

    const sortedItems = items.sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type]);
    
    return {
      items: sortedItems.slice(0, 4),
      totalCount: sortedItems.length,
    };
  }, [tasks, portfolioCompanies, pipelineCompanies]);

  const loading = portfolioLoading || pipelineLoading;

  return { priorityItems: priorityItems.items, totalCount: priorityItems.totalCount, loading };
}
