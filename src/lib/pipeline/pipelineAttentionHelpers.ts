import { differenceInDays, parseISO, isAfter, startOfDay } from 'date-fns';

export interface PipelineTask {
  id: string;
  pipeline_company_id: string | null;
  completed: boolean | null;
  scheduled_for: string | null;
}

export interface PipelineCardAttention {
  isStale: boolean;              // No activity > 14 days
  daysSinceTouch: number | null;
  hasOverdueTasks: boolean;
  openTaskCount: number;
  hasNextSteps: boolean;
  isClosingSoon: boolean;        // Close date within 14 days
  needsAttention: boolean;       // Composite: stale OR overdue OR closing soon
}

export interface ColumnSummary {
  staleCount: number;
  openTaskCount: number;
  closingSoonCount: number;
  overdueCount: number;
  summaryText: string;
}

export interface PipelineCompanyBase {
  id: string;
  last_interaction_at?: string | null;
  next_steps?: string | null;
  close_date?: string | null;
}

const STALE_THRESHOLD_DAYS = 14;
const CLOSING_SOON_DAYS = 14;

/**
 * Compute attention signals for a single pipeline company
 */
export function computeCardAttention(
  company: PipelineCompanyBase,
  tasks: PipelineTask[]
): PipelineCardAttention {
  const now = new Date();
  const today = startOfDay(now);
  
  // Calculate days since last touch
  let daysSinceTouch: number | null = null;
  if (company.last_interaction_at) {
    const lastTouch = parseISO(company.last_interaction_at);
    daysSinceTouch = differenceInDays(now, lastTouch);
  }
  
  // Is stale? (no activity > 14 days)
  const isStale = daysSinceTouch !== null && daysSinceTouch > STALE_THRESHOLD_DAYS;
  
  // Filter tasks for this company
  const companyTasks = tasks.filter(t => t.pipeline_company_id === company.id);
  const openTasks = companyTasks.filter(t => !t.completed);
  const openTaskCount = openTasks.length;
  
  // Check for overdue tasks
  const hasOverdueTasks = openTasks.some(task => {
    if (!task.scheduled_for) return false;
    const dueDate = parseISO(task.scheduled_for);
    return isAfter(today, dueDate);
  });
  
  // Has next steps defined?
  const hasNextSteps = Boolean(company.next_steps && company.next_steps.trim().length > 0);
  
  // Is closing soon? (within 14 days)
  let isClosingSoon = false;
  if (company.close_date) {
    const closeDate = parseISO(company.close_date);
    const daysUntilClose = differenceInDays(closeDate, now);
    isClosingSoon = daysUntilClose >= 0 && daysUntilClose <= CLOSING_SOON_DAYS;
  }
  
  // Composite: needs attention if stale, has overdue tasks, or closing soon
  const needsAttention = isStale || hasOverdueTasks || isClosingSoon;
  
  return {
    isStale,
    daysSinceTouch,
    hasOverdueTasks,
    openTaskCount,
    hasNextSteps,
    isClosingSoon,
    needsAttention,
  };
}

/**
 * Compute summary statistics for a column of companies
 */
export function computeColumnSummary(
  companies: PipelineCompanyBase[],
  allTasks: PipelineTask[]
): ColumnSummary {
  let staleCount = 0;
  let openTaskCount = 0;
  let closingSoonCount = 0;
  let overdueCount = 0;
  
  for (const company of companies) {
    const attention = computeCardAttention(company, allTasks);
    
    if (attention.isStale) staleCount++;
    if (attention.isClosingSoon) closingSoonCount++;
    if (attention.hasOverdueTasks) overdueCount++;
    openTaskCount += attention.openTaskCount;
  }
  
  // Build summary text
  const parts: string[] = [];
  if (staleCount > 0) parts.push(`${staleCount} stale`);
  if (overdueCount > 0) parts.push(`${overdueCount} overdue`);
  if (openTaskCount > 0) parts.push(`${openTaskCount} tasks`);
  if (closingSoonCount > 0) parts.push(`${closingSoonCount} closing soon`);
  
  const summaryText = parts.length > 0 ? parts.join(' • ') : 'All clear';
  
  return {
    staleCount,
    openTaskCount,
    closingSoonCount,
    overdueCount,
    summaryText,
  };
}

/**
 * Format days since touch for display
 */
export function formatDaysSinceTouch(days: number | null): string {
  if (days === null) return 'No activity';
  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  return `${days}d ago`;
}

/**
 * Get attention badge color class based on urgency
 */
export function getAttentionBadgeClass(attention: PipelineCardAttention): string {
  if (attention.hasOverdueTasks) {
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  }
  if (attention.isStale) {
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  }
  if (attention.isClosingSoon) {
    return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400';
  }
  return '';
}
