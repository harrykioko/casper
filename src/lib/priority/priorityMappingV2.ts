/**
 * Priority Mapping V2 - All 8 Source Types
 *
 * Maps all data sources to PriorityItem:
 * - Tasks (from v1)
 * - Inbox (from v1)
 * - Calendar (from v1)
 * - Portfolio companies (new)
 * - Pipeline companies (new)
 * - Reading list (new)
 * - Nonnegotiables (new)
 *
 * Status: Phase 1 - v2 Implementation
 */

import { format, parseISO, isToday, isPast, differenceInDays } from "date-fns";
import type { PriorityItem, PriorityIconType } from "@/types/priority";
import type { Task } from "@/hooks/useTasks";
import type { InboxItem } from "@/types/inbox";
import type { CalendarEvent } from "@/types/outlook";
import type { ReadingItem } from "@/types/readingItem";
import type { DashboardPortfolioCompany } from "@/hooks/useDashboardPortfolioCompanies";
import type { DashboardPipelineCompany } from "@/hooks/useDashboardPipelineFocus";
import { Database } from "@/integrations/supabase/types";

import {
  computePriorityScoreV2,
  computeTaskUrgencyScoreV2,
  computeTaskImportanceScoreV2,
  computeTaskEffortScoreV2,
  computeInboxUrgencyScoreV2,
  computeInboxImportanceScoreV2,
  computeCalendarUrgencyScoreV2,
  computeCalendarCommitmentScoreV2,
  computePortfolioUrgencyScoreV2,
  computePortfolioImportanceScoreV2,
  computePipelineUrgencyScoreV2,
  computePipelineImportanceScoreV2,
  computeReadingUrgencyScoreV2,
  computeReadingImportanceScoreV2,
  computeNonnegotiableUrgencyScoreV2,
  computeNonnegotiableImportanceScoreV2,
  computeRecencyScoreV2,
  generateSignalsV2,
} from "./priorityScoringV2";

type Nonnegotiable = Database['public']['Tables']['nonnegotiables']['Row'];

interface MappingOptions {
  availableMinutes?: number;
}

// ============================================================================
// TASK MAPPING (enhanced from v1)
// ============================================================================

export function mapTaskToPriorityItemV2(task: Task, options?: MappingOptions): PriorityItem {
  const hasCompanyLink = !!(task.company_id || task.pipeline_company_id);

  const urgencyScore = computeTaskUrgencyScoreV2(task.scheduledFor);
  const importanceScore = computeTaskImportanceScoreV2(
    task.priority as any,
    hasCompanyLink,
    task.is_top_priority
  );
  const recencyScore = computeRecencyScoreV2(task.updated_at);
  const effortScore = computeTaskEffortScoreV2(
    (task as any).effort_minutes,
    options?.availableMinutes
  );

  const priorityScore = computePriorityScoreV2(
    urgencyScore,
    importanceScore,
    0, // No commitment score for tasks
    recencyScore,
    effortScore,
    options
  );

  const iconType = getTaskIconType(task);
  const subtitle = getDueDateSubtitle(task.scheduledFor);

  const isOverdue = task.scheduledFor
    ? isPast(parseISO(task.scheduledFor)) && !isToday(parseISO(task.scheduledFor))
    : false;
  const isDueToday = task.scheduledFor ? isToday(parseISO(task.scheduledFor)) : false;

  const reasoning = generateTaskReasoning(task);
  const signals = generateSignalsV2(
    { urgency: urgencyScore, importance: importanceScore, commitment: 0, recency: recencyScore, effort: effortScore },
    {
      urgencyDescription: getUrgencyDescription(task.scheduledFor),
      importanceDescription: `${task.priority || "default"} priority`,
      recencyDescription: task.updated_at ? `Updated ${formatRelative(task.updated_at)}` : undefined,
      effortDescription: (task as any).effort_minutes ? `${(task as any).effort_minutes} min estimated` : "No estimate",
    }
  );

  return {
    id: `task-${task.id}`,
    sourceType: "task",
    sourceId: task.id,
    title: task.content,
    subtitle,
    description: task.content,
    contextLabels: getTaskContextLabels(task),
    iconType,
    urgencyScore,
    importanceScore,
    recencyScore,
    commitmentScore: 0,
    effortScore,
    priorityScore,
    dueAt: task.scheduledFor,
    snoozedUntil: (task as any).snoozed_until,
    createdAt: task.created_at,
    lastTouchedAt: task.updated_at,
    isOverdue,
    isDueToday,
    isDueSoon: !isOverdue && !isDueToday && urgencyScore >= 0.5,
    isCompleted: task.completed,
    isSnoozed: !!(task as any).snoozed_until,
    isTopPriority: task.is_top_priority ?? false,
    companyId: task.company_id || task.pipeline_company_id,
    projectId: task.project_id,
    projectName: task.project?.name,
    projectColor: task.project?.color,
    reasoning,
    signals,
  };
}

// ============================================================================
// INBOX MAPPING (enhanced from v1)
// ============================================================================

export function mapInboxItemToPriorityItemV2(inboxItem: InboxItem): PriorityItem {
  const hasCompanyLink = !!inboxItem.relatedCompanyId;

  const urgencyScore = computeInboxUrgencyScoreV2(inboxItem.receivedAt);
  const importanceScore = computeInboxImportanceScoreV2(inboxItem.isRead, hasCompanyLink);
  const recencyScore = urgencyScore; // For inbox, recency = urgency

  const priorityScore = computePriorityScoreV2(
    urgencyScore,
    importanceScore,
    0,
    recencyScore,
    0.5
  );

  const reasoning = `${inboxItem.isRead ? "Read" : "Unread"} email from ${inboxItem.senderName || inboxItem.senderEmail}. ${formatRelative(inboxItem.receivedAt)}.`;

  const signals = generateSignalsV2(
    { urgency: urgencyScore, importance: importanceScore, commitment: 0, recency: recencyScore },
    {
      urgencyDescription: `Received ${formatRelative(inboxItem.receivedAt)}`,
      importanceDescription: inboxItem.isRead ? "Read" : "Unread",
    }
  );

  return {
    id: `inbox-${inboxItem.id}`,
    sourceType: "inbox",
    sourceId: inboxItem.id,
    title: inboxItem.subject || "No subject",
    subtitle: inboxItem.senderName || inboxItem.senderEmail,
    description: inboxItem.preview || undefined,
    contextLabels: inboxItem.isRead ? ["Inbox"] : ["Inbox", "Unread"],
    iconType: "unread-email",
    urgencyScore,
    importanceScore,
    recencyScore,
    commitmentScore: 0,
    priorityScore,
    createdAt: inboxItem.receivedAt,
    lastTouchedAt: inboxItem.receivedAt,
    isSnoozed: !!inboxItem.snoozedUntil,
    snoozedUntil: inboxItem.snoozedUntil,
    companyId: inboxItem.relatedCompanyId,
    companyName: inboxItem.relatedCompanyName,
    reasoning,
    signals,
  };
}

// ============================================================================
// CALENDAR MAPPING (enhanced from v1)
// ============================================================================

export function mapCalendarEventToPriorityItemV2(event: CalendarEvent): PriorityItem {
  const attendeeCount = event.attendees?.length || 0;
  const hasAttendees = attendeeCount > 0;

  const urgencyScore = computeCalendarUrgencyScoreV2(event.startTime);
  const importanceScore = 0.8; // Calendar events are important
  const commitmentScore = computeCalendarCommitmentScoreV2(hasAttendees, attendeeCount);
  const recencyScore = 0.5; // Not applicable

  const priorityScore = computePriorityScoreV2(
    urgencyScore,
    importanceScore,
    commitmentScore,
    recencyScore,
    0.5
  );

  const subtitle = `${format(parseISO(event.startTime), 'h:mm a')}${event.location ? ` • ${event.location}` : ''}`;

  const reasoning = generateCalendarReasoning(event);
  const signals = generateSignalsV2(
    { urgency: urgencyScore, importance: importanceScore, commitment: commitmentScore, recency: recencyScore },
    {
      urgencyDescription: `Starts ${formatRelative(event.startTime)}`,
      importanceDescription: "Calendar commitment",
      commitmentDescription: hasAttendees ? `${attendeeCount} attendees` : "Personal event",
    }
  );

  return {
    id: `calendar-${event.microsoftEventId || event.id}`,
    sourceType: "calendar_event",
    sourceId: event.microsoftEventId || event.id,
    title: event.title,
    subtitle,
    description: event.description,
    contextLabels: ["Calendar"],
    iconType: "upcoming-event",
    urgencyScore,
    importanceScore,
    recencyScore,
    commitmentScore,
    priorityScore,
    eventStartAt: event.startTime,
    reasoning,
    signals,
  };
}

// ============================================================================
// PORTFOLIO COMPANY MAPPING (new in v2)
// ============================================================================

export function mapPortfolioCompanyToPriorityItemV2(company: DashboardPortfolioCompany): PriorityItem {
  const urgencyScore = computePortfolioUrgencyScoreV2(company.last_interaction_at);
  const importanceScore = computePortfolioImportanceScoreV2(company.status, company.open_task_count);
  const recencyScore = computeRecencyScoreV2(company.last_interaction_at || undefined);

  const priorityScore = computePriorityScoreV2(
    urgencyScore,
    importanceScore,
    0, // No commitment score
    recencyScore,
    0.5
  );

  const daysSinceContact = company.last_interaction_at
    ? differenceInDays(new Date(), parseISO(company.last_interaction_at))
    : null;

  const subtitle = daysSinceContact !== null
    ? `Last contact: ${daysSinceContact} days ago`
    : "Never contacted";

  const reasoning = generatePortfolioReasoning(company, daysSinceContact);
  const signals = generateSignalsV2(
    { urgency: urgencyScore, importance: importanceScore, commitment: 0, recency: recencyScore },
    {
      urgencyDescription: daysSinceContact !== null ? `${daysSinceContact} days since contact` : "Never contacted",
      importanceDescription: `${company.status} portfolio company`,
      recencyDescription: daysSinceContact !== null ? `Last touched ${daysSinceContact} days ago` : undefined,
    }
  );

  return {
    id: `portfolio-${company.id}`,
    sourceType: "portfolio_company",
    sourceId: company.id,
    title: company.name,
    subtitle,
    description: company.next_task || undefined,
    contextLabels: ["Portfolio", company.status],
    iconType: urgencyScore >= 0.8 ? "stale-company" : "high-importance",
    urgencyScore,
    importanceScore,
    recencyScore,
    commitmentScore: 0,
    priorityScore,
    lastTouchedAt: company.last_interaction_at || undefined,
    companyId: company.id,
    companyName: company.name,
    companyLogoUrl: company.logo_url,
    reasoning,
    signals,
  };
}

// ============================================================================
// PIPELINE COMPANY MAPPING (new in v2)
// ============================================================================

export function mapPipelineCompanyToPriorityItemV2(company: DashboardPipelineCompany): PriorityItem {
  const hasNextSteps = !!company.next_steps;

  const urgencyScore = computePipelineUrgencyScoreV2(
    company.last_interaction_at,
    company.close_date,
    hasNextSteps
  );
  const importanceScore = computePipelineImportanceScoreV2(
    company.status,
    company.is_top_of_mind,
    company.sector
  );
  const recencyScore = computeRecencyScoreV2(company.last_interaction_at || undefined);

  const priorityScore = computePriorityScoreV2(
    urgencyScore,
    importanceScore,
    0,
    recencyScore,
    0.5
  );

  const subtitle = company.next_steps || `${company.current_round} • ${company.sector || 'No sector'}`;

  const reasoning = generatePipelineReasoning(company);
  const signals = generateSignalsV2(
    { urgency: urgencyScore, importance: importanceScore, commitment: 0, recency: recencyScore },
    {
      urgencyDescription: company.close_date ? `Closes ${formatRelative(company.close_date)}` : "No close date",
      importanceDescription: company.is_top_of_mind ? "Top of mind" : `${company.status} deal`,
    }
  );

  return {
    id: `pipeline-${company.id}`,
    sourceType: "pipeline_company",
    sourceId: company.id,
    title: company.company_name,
    subtitle,
    description: company.next_steps || undefined,
    contextLabels: ["Pipeline", company.current_round, company.status],
    iconType: urgencyScore >= 0.7 ? "stale-company" : "high-importance",
    urgencyScore,
    importanceScore,
    recencyScore,
    commitmentScore: 0,
    priorityScore,
    dueAt: company.close_date,
    lastTouchedAt: company.last_interaction_at || undefined,
    companyId: company.id,
    companyName: company.company_name,
    companyLogoUrl: company.logo_url,
    reasoning,
    signals,
  };
}

// ============================================================================
// READING LIST MAPPING (new in v2)
// ============================================================================

export function mapReadingItemToPriorityItemV2(item: ReadingItem): PriorityItem {
  const hasProject = !!item.project_id;
  const createdAt = item.created_at || new Date().toISOString();

  const urgencyScore = computeReadingUrgencyScoreV2(createdAt);
  const importanceScore = computeReadingImportanceScoreV2(item.isRead, hasProject);
  const recencyScore = computeRecencyScoreV2(createdAt);

  const priorityScore = computePriorityScoreV2(
    urgencyScore,
    importanceScore,
    0,
    recencyScore,
    0.3 // Reading is typically quick
  );

  const daysOld = differenceInDays(new Date(), parseISO(createdAt));

  const reasoning = `${item.isRead ? "Read" : "Unread"} article saved ${daysOld} days ago.`;
  const signals = generateSignalsV2(
    { urgency: urgencyScore, importance: importanceScore, commitment: 0, recency: recencyScore },
    {
      urgencyDescription: `Saved ${daysOld} days ago`,
      importanceDescription: item.isRead ? "Already read" : "Unread",
    }
  );

  return {
    id: `reading-${item.id}`,
    sourceType: "reading_item",
    sourceId: item.id,
    title: item.title || item.url,
    subtitle: item.hostname || item.url,
    description: item.description || undefined,
    contextLabels: item.isRead ? ["Reading List", "Read"] : ["Reading List", "Unread"],
    iconType: "unread-reading",
    urgencyScore,
    importanceScore,
    recencyScore,
    commitmentScore: 0,
    priorityScore,
    createdAt,
    projectId: item.project_id,
    reasoning,
    signals,
  };
}

// ============================================================================
// NONNEGOTIABLE MAPPING (new in v2)
// ============================================================================

export function mapNonnegotiableToPriorityItemV2(item: Nonnegotiable): PriorityItem {
  const urgencyScore = computeNonnegotiableUrgencyScoreV2(item.reminder_time, item.frequency);
  const importanceScore = computeNonnegotiableImportanceScoreV2(item.is_active ?? true);
  const commitmentScore = 0.9; // Nonnegotiables are commitments to self

  const priorityScore = computePriorityScoreV2(
    urgencyScore,
    importanceScore,
    commitmentScore,
    0.5,
    0.5
  );

  const subtitle = item.frequency
    ? `${item.frequency}${item.reminder_time ? ` at ${item.reminder_time}` : ''}`
    : 'Recurring habit';

  const reasoning = `${item.frequency || 'Recurring'} habit: ${item.title}`;
  const signals = generateSignalsV2(
    { urgency: urgencyScore, importance: importanceScore, commitment: commitmentScore, recency: 0.5 },
    {
      urgencyDescription: item.reminder_time ? `Reminder at ${item.reminder_time}` : "No specific time",
      importanceDescription: item.is_active ? "Active habit" : "Inactive habit",
      commitmentDescription: "Commitment to self",
    }
  );

  return {
    id: `nonneg-${item.id}`,
    sourceType: "nonnegotiable",
    sourceId: item.id,
    title: item.title,
    subtitle,
    description: item.description || undefined,
    contextLabels: ["Nonnegotiable", item.frequency || "habit"],
    iconType: "nonnegotiable",
    urgencyScore,
    importanceScore,
    recencyScore: 0.5,
    commitmentScore,
    priorityScore,
    projectId: item.project_id,
    reasoning,
    signals,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getTaskIconType(task: Task): PriorityIconType {
  if (task.scheduledFor) {
    const dueDate = parseISO(task.scheduledFor);
    if (isPast(dueDate) && !isToday(dueDate)) {
      return "overdue";
    }
    if (isToday(dueDate)) {
      return "due-today";
    }
    const urgency = computeTaskUrgencyScoreV2(task.scheduledFor);
    if (urgency >= 0.5) {
      return "due-soon";
    }
  }
  if (task.priority === "high") {
    return "high-importance";
  }
  return "high-importance";
}

function getDueDateSubtitle(scheduledFor: string | undefined): string | undefined {
  if (!scheduledFor) return undefined;

  const dueDate = parseISO(scheduledFor);
  if (isPast(dueDate) && !isToday(dueDate)) {
    const days = Math.abs(differenceInDays(new Date(), dueDate));
    return `Overdue by ${days} day${days === 1 ? '' : 's'}`;
  }
  if (isToday(dueDate)) {
    return "Due today";
  }
  return `Due ${format(dueDate, 'MMM d')}`;
}

function getUrgencyDescription(scheduledFor: string | null | undefined): string {
  if (!scheduledFor) return "No due date";

  const dueDate = parseISO(scheduledFor);
  if (isPast(dueDate) && !isToday(dueDate)) {
    const days = Math.abs(differenceInDays(new Date(), dueDate));
    return `Overdue by ${days} days`;
  }
  if (isToday(dueDate)) {
    return "Due today";
  }
  const days = differenceInDays(dueDate, new Date());
  return `Due in ${days} day${days === 1 ? '' : 's'}`;
}

function getTaskContextLabels(task: Task): string[] {
  const labels: string[] = [];
  if (task.project?.name) labels.push(`Project: ${task.project.name}`);
  if (task.priority) labels.push(`${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} priority`);
  if (task.category) labels.push(task.category);
  return labels;
}

function formatRelative(timestamp: string): string {
  const date = parseISO(timestamp);
  const days = differenceInDays(new Date(), date);

  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return format(date, 'MMM d');
}

function generateTaskReasoning(task: Task): string {
  const parts: string[] = [];

  if (task.scheduledFor) {
    const dueDate = parseISO(task.scheduledFor);
    const days = differenceInDays(dueDate, new Date());

    if (days < 0) {
      parts.push(`Overdue by ${Math.abs(days)} days`);
    } else if (isToday(dueDate)) {
      parts.push("Due today");
    } else if (days === 1) {
      parts.push("Due tomorrow");
    } else if (days <= 7) {
      parts.push(`Due in ${days} days`);
    }
  }

  if (task.priority === "high") {
    parts.push("High priority");
  }

  return parts.length > 0 ? parts.join(". ") + "." : "Task needs attention.";
}

function generateCalendarReasoning(event: CalendarEvent): string {
  const start = parseISO(event.startTime);
  const hoursUntil = (start.getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursUntil < 1) {
    return `Starts in ${Math.round(hoursUntil * 60)} minutes.`;
  } else if (hoursUntil < 24) {
    return `Starts in ${Math.floor(hoursUntil)} hours.`;
  }
  return `Starts ${format(start, 'MMM d')} at ${format(start, 'h:mm a')}.`;
}

function generatePortfolioReasoning(company: DashboardPortfolioCompany, daysSince: number | null): string {
  const parts: string[] = [];

  if (daysSince !== null) {
    if (daysSince >= 30) {
      parts.push(`Critical: ${daysSince} days without contact`);
    } else if (daysSince >= 14) {
      parts.push(`Needs attention: ${daysSince} days since last contact`);
    }
  } else {
    parts.push("Never contacted");
  }

  if (company.open_task_count > 0) {
    parts.push(`${company.open_task_count} open tasks`);
  }

  return parts.length > 0 ? parts.join(". ") + "." : "Portfolio company needs attention.";
}

function generatePipelineReasoning(company: DashboardPipelineCompany): string {
  const parts: string[] = [];

  if (company.close_date) {
    const daysUntil = differenceInDays(parseISO(company.close_date), new Date());
    if (daysUntil < 0) {
      parts.push(`Past close date by ${Math.abs(daysUntil)} days`);
    } else if (daysUntil <= 7) {
      parts.push(`Closing in ${daysUntil} days`);
    }
  }

  if (company.is_top_of_mind) {
    parts.push("Top of mind");
  }

  if (company.next_steps) {
    parts.push(`Next: ${company.next_steps}`);
  }

  return parts.length > 0 ? parts.join(". ") + "." : "Pipeline deal needs attention.";
}
