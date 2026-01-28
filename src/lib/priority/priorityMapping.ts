/**
 * Priority Mapping - Source to PriorityItem Transformations
 *
 * This file contains functions to map each data source (tasks, inbox, companies, etc.)
 * to the unified PriorityItem interface.
 *
 * Status: Phase 1 - Stubbed/unimplemented
 * See docs/priority_system/02_proposed_model.md for full mapping specifications
 *
 * TODO: Implement in Phase 2
 * - Complete mapping functions for each source type
 * - Add unit tests for each mapper
 * - Wire into useUnifiedPriority() hook
 */

import { differenceInDays, differenceInHours, parseISO, isToday, isPast, startOfDay, format } from "date-fns";
import type { PriorityItem, PrioritySignal, PriorityIconType } from "@/types/priority";
import type { Task } from "@/hooks/useTasks"; // Assuming Task type exists
// Import other types as needed

/**
 * Map a Task to a PriorityItem
 *
 * Scoring logic:
 * - Urgency: Based on deadline proximity (overdue = max urgency)
 * - Importance: Based on explicit priority field + company linkage
 * - Recency: Based on last update timestamp
 * - Commitment: Tasks are implicit commitments (default 0.4)
 *
 * See docs/priority_system/02_proposed_model.md section "Tasks → PriorityItem"
 */
export function mapTaskToPriorityItem(task: Task): PriorityItem {
  // TODO: Implement full mapping logic
  // This is a skeleton implementation

  const now = new Date();
  const id = `task-${task.id}`;
  const sourceType = "task" as const;

  // Placeholder scores
  const urgencyScore = 0.5;
  const importanceScore = 0.5;
  const recencyScore = 0.5;
  const commitmentScore = 0.4;

  // Placeholder priority score (should be computed from weights)
  const priorityScore = 0.5;

  return {
    id,
    sourceType,
    sourceId: task.id,
    title: task.content,
    subtitle: undefined,
    description: task.content,
    contextLabels: [],
    iconType: "high-importance",
    urgencyScore,
    importanceScore,
    recencyScore,
    commitmentScore,
    priorityScore,
    reasoning: "TODO: Implement reasoning logic",
    signals: [],
    // Add other fields as needed
  };
}

/**
 * Map an InboxItem to a PriorityItem
 *
 * Scoring logic:
 * - Urgency: Based on email age (recent = high urgency)
 * - Importance: Based on sender and company context
 * - Recency: Same as urgency for emails (freshness matters)
 * - Commitment: Unread emails imply need to respond (0.6 if unread, 0.3 if read)
 *
 * See docs/priority_system/02_proposed_model.md section "Inbox Items → PriorityItem"
 */
export function mapInboxItemToPriorityItem(inboxItem: any): PriorityItem {
  // TODO: Implement full mapping logic
  // This is a skeleton implementation

  const id = `inbox-${inboxItem.id}`;
  const sourceType = "inbox" as const;

  // Placeholder scores
  const urgencyScore = 0.5;
  const importanceScore = 0.5;
  const recencyScore = 0.5;
  const commitmentScore = 0.5;
  const priorityScore = 0.5;

  return {
    id,
    sourceType,
    sourceId: inboxItem.id,
    title: inboxItem.subject || "No subject",
    subtitle: inboxItem.from_name || inboxItem.from_email,
    description: inboxItem.snippet,
    contextLabels: [],
    iconType: "unread-email",
    urgencyScore,
    importanceScore,
    recencyScore,
    commitmentScore,
    priorityScore,
    reasoning: "TODO: Implement reasoning logic",
    signals: [],
  };
}

/**
 * Map a Portfolio Company to a PriorityItem
 *
 * Scoring logic:
 * - Urgency: Based on interaction staleness + next task due date
 * - Importance: Based on company status (active = high) + open task count
 * - Recency: Based on last interaction date
 * - Commitment: Portfolio companies are ongoing commitments (0.6)
 *
 * See docs/priority_system/02_proposed_model.md section "Portfolio Companies → PriorityItem"
 */
export function mapPortfolioCompanyToPriorityItem(company: any): PriorityItem {
  // TODO: Implement full mapping logic
  // This is a skeleton implementation

  const id = `portfolio-${company.id}`;
  const sourceType = "portfolio_company" as const;

  // Placeholder scores
  const urgencyScore = 0.5;
  const importanceScore = 0.5;
  const recencyScore = 0.5;
  const commitmentScore = 0.6;
  const priorityScore = 0.5;

  return {
    id,
    sourceType,
    sourceId: company.id,
    title: company.name,
    subtitle: "Needs attention",
    description: undefined,
    contextLabels: ["Portfolio"],
    iconType: "stale-company",
    urgencyScore,
    importanceScore,
    recencyScore,
    commitmentScore,
    priorityScore,
    reasoning: "TODO: Implement reasoning logic",
    signals: [],
    companyId: company.id,
    companyName: company.name,
    companyLogoUrl: company.logo_url,
  };
}

/**
 * Map a Pipeline Company to a PriorityItem
 *
 * Similar to portfolio companies, but with adjustments:
 * - Importance: is_top_of_mind flag + close_date proximity boost
 * - Urgency: close_date creates additional urgency
 *
 * See docs/priority_system/02_proposed_model.md section "Pipeline Companies → PriorityItem"
 */
export function mapPipelineCompanyToPriorityItem(company: any): PriorityItem {
  // TODO: Implement full mapping logic
  // This is a skeleton implementation

  const id = `pipeline-${company.id}`;
  const sourceType = "pipeline_company" as const;

  // Placeholder scores
  const urgencyScore = 0.5;
  const importanceScore = 0.5;
  const recencyScore = 0.5;
  const commitmentScore = 0.6;
  const priorityScore = 0.5;

  return {
    id,
    sourceType,
    sourceId: company.id,
    title: company.company_name,
    subtitle: "Needs attention",
    description: undefined,
    contextLabels: ["Pipeline"],
    iconType: "stale-company",
    urgencyScore,
    importanceScore,
    recencyScore,
    commitmentScore,
    priorityScore,
    reasoning: "TODO: Implement reasoning logic",
    signals: [],
    companyId: company.id,
    companyName: company.company_name,
    companyLogoUrl: company.logo_url,
  };
}

/**
 * Map a Calendar Event to a PriorityItem
 *
 * Scoring logic:
 * - Urgency: Based on proximity to event start (very high if starting soon)
 * - Importance: Based on attendee count and event type
 * - Recency: Not applicable to future events (default 0.5)
 * - Commitment: Calendar events are explicit commitments (1.0)
 *
 * See docs/priority_system/02_proposed_model.md section "Calendar Events → PriorityItem"
 */
export function mapCalendarEventToPriorityItem(event: any): PriorityItem {
  // TODO: Implement full mapping logic
  // This is a skeleton implementation

  const id = `calendar-${event.id}`;
  const sourceType = "calendar_event" as const;

  // Placeholder scores
  const urgencyScore = 0.7;
  const importanceScore = 0.6;
  const recencyScore = 0.5;
  const commitmentScore = 1.0;
  const priorityScore = 0.7;

  return {
    id,
    sourceType,
    sourceId: event.id,
    title: event.title,
    subtitle: `Event at ${event.start_time}`,
    description: event.description,
    contextLabels: ["Calendar"],
    iconType: "upcoming-event",
    urgencyScore,
    importanceScore,
    recencyScore,
    commitmentScore,
    priorityScore,
    eventStartAt: event.start_time,
    reasoning: "TODO: Implement reasoning logic",
    signals: [],
  };
}

/**
 * Map a Reading Item to a PriorityItem
 *
 * Scoring logic:
 * - Urgency: Generally low unless project-linked (0.2 base, 0.4 if project)
 * - Importance: Based on project context (0.3 base, 0.6 if project)
 * - Recency: Freshly bookmarked items are more relevant (decay over time)
 * - Commitment: Low unless project-linked (0.2 base, 0.4 if project)
 *
 * See docs/priority_system/02_proposed_model.md section "Reading Items → PriorityItem"
 */
export function mapReadingItemToPriorityItem(item: any): PriorityItem {
  // TODO: Implement full mapping logic
  // This is a skeleton implementation

  const id = `reading-${item.id}`;
  const sourceType = "reading_item" as const;

  // Placeholder scores
  const urgencyScore = 0.2;
  const importanceScore = 0.3;
  const recencyScore = 0.5;
  const commitmentScore = 0.2;
  const priorityScore = 0.3;

  return {
    id,
    sourceType,
    sourceId: item.id,
    title: item.title || "Untitled",
    subtitle: item.hostname,
    description: item.description,
    contextLabels: ["Reading", "Unread"],
    iconType: "unread-reading",
    urgencyScore,
    importanceScore,
    recencyScore,
    commitmentScore,
    priorityScore,
    reasoning: "TODO: Implement reasoning logic",
    signals: [],
    projectId: item.project_id,
    projectName: undefined, // Would need to join with projects
  };
}

/**
 * Map a Nonnegotiable (habit) to a PriorityItem
 *
 * Scoring logic:
 * - Urgency: Based on reminder_time today (0.5 base, 0.9 if reminder soon)
 * - Importance: Nonnegotiables are self-commitments (0.7)
 * - Recency: Not applicable (0.5)
 * - Commitment: Very high - explicit personal commitments (1.0)
 *
 * See docs/priority_system/02_proposed_model.md section "Nonnegotiables → PriorityItem"
 */
export function mapNonnegotiableToPriorityItem(nonnegotiable: any): PriorityItem {
  // TODO: Implement full mapping logic
  // This is a skeleton implementation

  const id = `nonnegotiable-${nonnegotiable.id}`;
  const sourceType = "nonnegotiable" as const;

  // Placeholder scores
  const urgencyScore = 0.5;
  const importanceScore = 0.7;
  const recencyScore = 0.5;
  const commitmentScore = 1.0;
  const priorityScore = 0.7;

  return {
    id,
    sourceType,
    sourceId: nonnegotiable.id,
    title: nonnegotiable.title,
    subtitle: nonnegotiable.frequency,
    description: nonnegotiable.description,
    contextLabels: ["Nonnegotiable"],
    iconType: "nonnegotiable",
    urgencyScore,
    importanceScore,
    recencyScore,
    commitmentScore,
    priorityScore,
    reasoning: "TODO: Implement reasoning logic",
    signals: [],
  };
}

/**
 * Helper: Generate a unique priority item ID
 * Format: {sourceType}-{sourceId}
 */
export function generatePriorityItemId(sourceType: string, sourceId: string): string {
  return `${sourceType}-${sourceId}`;
}

/**
 * Helper: Determine icon type based on task state
 */
export function getTaskIconType(task: Task): PriorityIconType {
  // TODO: Implement logic based on task due dates and priority
  if (task.scheduledFor) {
    const dueDate = parseISO(task.scheduledFor);
    if (isPast(startOfDay(dueDate)) && !isToday(dueDate)) {
      return "overdue";
    }
    if (isToday(dueDate)) {
      return "due-today";
    }
    const daysUntil = differenceInDays(dueDate, new Date());
    if (daysUntil <= 3) {
      return "due-soon";
    }
  }
  if (task.priority === "high") {
    return "high-importance";
  }
  return "high-importance"; // Default
}
