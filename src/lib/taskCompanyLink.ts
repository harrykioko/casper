export interface TaskCompanyLink {
  type: 'portfolio' | 'pipeline';
  id: string;
  name?: string;
}

/** Read the company link from a task record */
export function getTaskCompanyLink(task: {
  company_id?: string | null;
  pipeline_company_id?: string | null;
}): TaskCompanyLink | null {
  if (task.pipeline_company_id) return { type: 'pipeline', id: task.pipeline_company_id };
  if (task.company_id) return { type: 'portfolio', id: task.company_id };
  return null;
}

/** Convert a TaskCompanyLink into DB field values for insert/update */
export function setTaskCompanyLink(link: TaskCompanyLink | null): {
  company_id: string | null;
  pipeline_company_id: string | null;
} {
  if (!link) return { company_id: null, pipeline_company_id: null };
  return {
    company_id: link.type === 'portfolio' ? link.id : null,
    pipeline_company_id: link.type === 'pipeline' ? link.id : null,
  };
}
