import { useMemo, useState, useEffect } from 'react';
import { Task } from './useTasks';
import { supabase } from '@/integrations/supabase/client';

export interface LinkedEntity {
  type: 'portfolio' | 'pipeline' | 'project' | 'email';
  id: string;
  name: string;
  logo_url?: string | null;
  color?: string;
}

export interface EnrichedTask extends Task {
  linkedEntity?: LinkedEntity;
  linkedEntities: LinkedEntity[];
}

interface CompanyRecord {
  id: string;
  name: string;
  logo_url: string | null;
}

interface PipelineRecord {
  id: string;
  company_name: string;
  logo_url: string | null;
}

export function useEnrichedTasks(tasks: Task[]): EnrichedTask[] {
  const [portfolioMap, setPortfolioMap] = useState<Map<string, CompanyRecord>>(new Map());
  const [pipelineMap, setPipelineMap] = useState<Map<string, PipelineRecord>>(new Map());

  const pipelineIds = useMemo(
    () => [...new Set(tasks.map(t => t.pipeline_company_id).filter(Boolean))] as string[],
    [tasks]
  );
  const portfolioIds = useMemo(
    () => [...new Set(tasks.map(t => t.company_id).filter(Boolean))] as string[],
    [tasks]
  );

  useEffect(() => {
    if (pipelineIds.length === 0) { setPipelineMap(new Map()); return; }
    supabase
      .from('pipeline_companies')
      .select('id, company_name, logo_url')
      .in('id', pipelineIds)
      .then(({ data }) => {
        if (data) setPipelineMap(new Map(data.map(c => [c.id, c])));
      });
  }, [pipelineIds.join(',')]);

  useEffect(() => {
    if (portfolioIds.length === 0) { setPortfolioMap(new Map()); return; }
    supabase
      .from('companies')
      .select('id, name, logo_url')
      .in('id', portfolioIds)
      .then(({ data }) => {
        if (data) setPortfolioMap(new Map(data.map(c => [c.id, c])));
      });
  }, [portfolioIds.join(',')]);

  const enrichedTasks = useMemo(() => {
    const safePipelineMap = pipelineMap instanceof Map ? pipelineMap : new Map();
    const safePortfolioMap = portfolioMap instanceof Map ? portfolioMap : new Map();

    return tasks.map((task): EnrichedTask => {
      const entities: LinkedEntity[] = [];

      if (task.pipeline_company_id) {
        const company = safePipelineMap.get(task.pipeline_company_id);
        if (company) {
          entities.push({
            type: 'pipeline',
            id: company.id,
            name: company.company_name,
            logo_url: company.logo_url,
          });
        }
      }
      if (task.company_id) {
        const company = safePortfolioMap.get(task.company_id);
        if (company) {
          entities.push({
            type: 'portfolio',
            id: company.id,
            name: company.name,
            logo_url: company.logo_url,
          });
        }
      }
      if (task.project) {
        entities.push({
          type: 'project',
          id: task.project.id,
          name: task.project.name,
          color: task.project.color,
        });
      }
      if (task.source_inbox_item_id) {
        entities.push({
          type: 'email',
          id: task.source_inbox_item_id,
          name: 'From email',
        });
      }

      return { ...task, linkedEntities: entities, linkedEntity: entities[0] };
    });
  }, [tasks, portfolioMap, pipelineMap]);

  return enrichedTasks;
}
