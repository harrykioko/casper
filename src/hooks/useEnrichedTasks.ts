import { useMemo } from 'react';
import { Task } from './useTasks';
import { useDashboardPortfolioCompanies } from './useDashboardPortfolioCompanies';
import { useDashboardPipelineFocus } from './useDashboardPipelineFocus';

export interface LinkedEntity {
  type: 'portfolio' | 'pipeline' | 'project' | 'email';
  id: string;
  name: string;
  logo_url?: string | null;
  color?: string;
}

export interface EnrichedTask extends Task {
  linkedEntity?: LinkedEntity;
}

export function useEnrichedTasks(tasks: Task[]): EnrichedTask[] {
  const { companies: portfolioCompanies } = useDashboardPortfolioCompanies();
  const { companies: pipelineCompanies } = useDashboardPipelineFocus();

  const enrichedTasks = useMemo(() => {
    const portfolioMap = new Map(portfolioCompanies.map(c => [c.id, c]));
    const pipelineMap = new Map(pipelineCompanies.map(c => [c.id, c]));

    return tasks.map((task): EnrichedTask => {
      let linkedEntity: LinkedEntity | undefined = undefined;

      // Priority: pipeline_company > company > project > email
      if (task.pipeline_company_id) {
        const company = pipelineMap.get(task.pipeline_company_id);
        if (company) {
          linkedEntity = {
            type: 'pipeline',
            id: company.id,
            name: company.company_name,
            logo_url: company.logo_url,
          };
        }
      } else if (task.company_id) {
        const company = portfolioMap.get(task.company_id);
        if (company) {
          linkedEntity = {
            type: 'portfolio',
            id: company.id,
            name: company.name,
            logo_url: company.logo_url,
          };
        }
      } else if (task.project) {
        linkedEntity = {
          type: 'project',
          id: task.project.id,
          name: task.project.name,
          color: task.project.color,
        };
      } else if (task.source_inbox_item_id) {
        linkedEntity = {
          type: 'email',
          id: task.source_inbox_item_id,
          name: 'From email',
        };
      }

      return { ...task, linkedEntity };
    });
  }, [tasks, portfolioCompanies, pipelineCompanies]);

  return enrichedTasks;
}
