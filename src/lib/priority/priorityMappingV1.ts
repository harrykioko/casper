/**
 * Priority Mapping V1 - Source to PriorityItem Transformations
 *
 * This file contains the v1 mapping functions for transforming data sources
 * into the unified PriorityItem interface.
 *
 * Status: Phase 1 - v1 Implementation
 * See docs/priority_system/03_v1_tuning_guide.md for tuning instructions
 *
 * v1 SOURCES (implemented):
 * - Tasks (all incomplete tasks)
 * - Inbox items (unread/unresolved)
 * - Calendar events (today + next 48 hours)
 *
 * v2+ SOURCES (deferred):
 * - Portfolio companies
 * - Pipeline companies
 * - Reading list items
 * - Nonnegotiables
 */

import { format, parseISO, isToday, isPast } from "date-fns";
import type { PriorityItem, PriorityIconType } from "@/types/priority";
import type { Task } from "@/hooks/useTasks";
import type { InboxItem } from "@/types/inbox";
import type { CalendarEvent } from "@/types/outlook";
import {
  computePriorityScoreV1,
  computeTaskUrgencyScore,
  computeTaskImportanceScore,
  computeInboxUrgencyScore,
  computeInboxImportanceScore,
  computeCalendarUrgencyScore,
  computeCalendarImportanceScore,
  computeRecencyScore,
  generateTaskReasoning,
  generateInboxReasoning,
  generateCalendarReasoning,
  generateSignals,
} from "./priorityScoringV1";

/**
 * Map a Task to a PriorityItem (v1)
 *
 * Scoring logic:
 * - Urgency: Based on days to due date (overdue = max urgency)
 * - Importance: Based on explicit priority field ONLY (no company boost in v1)
 * - Recency: Computed for debugging but NOT weighted in v1
 */
export function mapTaskToPriorityItemV1(task: Task): PriorityItem {
  // URGENCY: Based on deadline proximity
  const urgencyScore = computeTaskUrgencyScore(task.scheduledFor);

  // IMPORTANCE: Based on task.priority field ONLY
  const importanceScore = computeTaskImportanceScore(task.priority);

  // RECENCY: Compute for debugging only (not used in v1 scoring)
  const recencyScore = computeRecencyScore(task.updated_at);

  // PRIORITY SCORE (v1 simplified formula)
  const priorityScore = computePriorityScoreV1(urgencyScore, importanceScore);

  // ICON TYPE
  const iconType = getTaskIconType(task);

  // SUBTITLE
  const subtitle = getDueDateSubtitle(task.scheduledFor);

  // REASONING
  const reasoning = generateTaskReasoning(
    task.scheduledFor,
    task.priority,
    getCompanyName(task)
  );

  // SIGNALS
  const signals = generateSignals(
    urgencyScore,
    importanceScore,
    recencyScore,
    "task",
    {
      urgencyDescription: getTaskUrgencyDescription(task),
      importanceDescription: `${task.priority || "default"} priority`,
    }
  );

  // STATE FLAGS
  const isOverdue = task.scheduledFor ?
    isPast(parseISO(task.scheduledFor)) && !isToday(parseISO(task.scheduledFor)) :
    false;
  const isDueToday = task.scheduledFor ? isToday(parseISO(task.scheduledFor)) : false;

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
    commitmentScore: 0, // Not used in v1
    priorityScore,
    dueAt: task.scheduledFor,
    createdAt: task.created_at,
    lastTouchedAt: task.updated_at,
    isOverdue,
    isDueToday,
    isDueSoon: !isOverdue && !isDueToday && task.scheduledFor ? urgencyScore >= 0.5 : false,
    isCompleted: task.completed,
    isTopPriority: task.is_top_priority ?? false,
    reasoning,
    signals,
    companyId: task.company_id || task.pipeline_company_id,
    companyName: getCompanyName(task),
    projectId: task.project_id,
    projectName: task.project?.name,
    projectColor: task.project?.color,
  };
}

/**
 * Map an InboxItem to a PriorityItem (v1)
 *
 * Scoring logic:
 * - Urgency: Based on age of item (hours/days)
 * - Importance: Binary - unread/unresolved = important
 * - Recency: Computed for debugging but NOT weighted in v1
 */
export function mapInboxItemToPriorityItemV1(inboxItem: InboxItem): PriorityItem {
  // URGENCY: Based on email age
  const urgencyScore = computeInboxUrgencyScore(inboxItem.receivedAt);

  // IMPORTANCE: Binary flag (unread/unresolved = important)
  const importanceScore = computeInboxImportanceScore(inboxItem.isRead);

  // RECENCY: Same as urgency for emails (for debugging)
  const recencyScore = urgencyScore;

  // PRIORITY SCORE (v1 simplified)
  const priorityScore = computePriorityScoreV1(urgencyScore, importanceScore);

  // REASONING
  const reasoning = generateInboxReasoning(inboxItem.receivedAt, inboxItem.isRead);

  // SIGNALS
  const signals = generateSignals(
    urgencyScore,
    importanceScore,
    recencyScore,
    "inbox",
    {
      urgencyDescription: getInboxUrgencyDescription(inboxItem),
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
    contextLabels: getInboxContextLabels(inboxItem),
    iconType: "unread-email",
    urgencyScore,
    importanceScore,
    recencyScore,
    commitmentScore: 0, // Not used in v1
    priorityScore,
    createdAt: inboxItem.receivedAt,
    lastTouchedAt: inboxItem.receivedAt,
    isSnoozed: !!inboxItem.snoozedUntil,
    snoozedUntil: inboxItem.snoozedUntil,
    isTopPriority: inboxItem.isTopPriority ?? false,
    reasoning,
    signals,
    companyId: inboxItem.relatedCompanyId,
    companyName: inboxItem.relatedCompanyName,
  };
}

/**
 * Map a CalendarEvent to a PriorityItem (v1)
 *
 * Scoring logic:
 * - Urgency: Based on proximity to event start (very high if starting soon)
 * - Importance: Fixed importance for all calendar events in v1 (0.8)
 * - Recency: Not applicable to future events (default 0.5)
 */
export function mapCalendarEventToPriorityItemV1(event: CalendarEvent): PriorityItem {
  // URGENCY: Based on proximity to event start
  const urgencyScore = computeCalendarUrgencyScore(event.startTime);

  // IMPORTANCE: Fixed importance for all calendar events in v1
  const importanceScore = computeCalendarImportanceScore();

  // RECENCY: Not applicable to future events
  const recencyScore = 0.5;

  // PRIORITY SCORE (v1 simplified)
  const priorityScore = computePriorityScoreV1(urgencyScore, importanceScore);

  // SUBTITLE
  const subtitle = `Event at ${format(parseISO(event.startTime), 'h:mm a')}`;

  // REASONING
  const reasoning = generateCalendarReasoning(event.startTime);

  // SIGNALS
  const signals = generateSignals(
    urgencyScore,
    importanceScore,
    recencyScore,
    "calendar_event",
    {
      urgencyDescription: getCalendarUrgencyDescription(event),
      importanceDescription: "Calendar commitment",
    }
  );

  return {
    id: `calendar-${event.id}`,
    sourceType: "calendar_event",
    sourceId: event.id,
    title: event.title,
    subtitle,
    description: event.description,
    contextLabels: ["Calendar"],
    iconType: "upcoming-event",
    urgencyScore,
    importanceScore,
    recencyScore,
    commitmentScore: 0, // Not used in v1 (but calendar events are implicitly high commitment)
    priorityScore,
    eventStartAt: event.startTime,
    isTopPriority: false, // Calendar events don't support override in v1
    reasoning,
    signals,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get company name from task (if linked)
 */
function getCompanyName(task: Task): string | undefined {
  // Note: In v1, we don't have company data in the task object
  // This would require joining with companies table
  // For now, just check if company_id exists
  return undefined; // TODO: Implement company lookup if needed
}

/**
 * Get task icon type based on state
 */
function getTaskIconType(task: Task): PriorityIconType {
  if (task.scheduledFor) {
    const dueDate = parseISO(task.scheduledFor);
    if (isPast(dueDate) && !isToday(dueDate)) {
      return "overdue";
    }
    if (isToday(dueDate)) {
      return "due-today";
    }
    // Due soon (urgency >= 0.5 means within 3 days)
    const urgency = computeTaskUrgencyScore(task.scheduledFor);
    if (urgency >= 0.5) {
      return "due-soon";
    }
  }
  if (task.priority === "high") {
    return "high-importance";
  }
  return "high-importance"; // Default
}

/**
 * Get due date subtitle for task
 */
function getDueDateSubtitle(scheduledFor: string | undefined): string | undefined {
  if (!scheduledFor) {
    return undefined;
  }

  const dueDate = parseISO(scheduledFor);
  if (isPast(dueDate) && !isToday(dueDate)) {
    const daysOverdue = Math.abs(Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
    return `Overdue by ${daysOverdue} day${daysOverdue === 1 ? '' : 's'}`;
  }
  if (isToday(dueDate)) {
    return "Due today";
  }
  return `Due ${format(dueDate, 'MMM d')}`;
}

/**
 * Get task urgency description
 */
function getTaskUrgencyDescription(task: Task): string {
  if (!task.scheduledFor) {
    return "No due date";
  }

  const dueDate = parseISO(task.scheduledFor);
  if (isPast(dueDate) && !isToday(dueDate)) {
    const daysOverdue = Math.abs(Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
    return `Overdue by ${daysOverdue} days`;
  }
  if (isToday(dueDate)) {
    return "Due today";
  }

  const daysUntil = Math.floor((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysUntil === 1) {
    return "Due tomorrow";
  }
  if (daysUntil <= 7) {
    return `Due in ${daysUntil} days`;
  }
  return `Due in ${daysUntil} days`;
}

/**
 * Get inbox urgency description
 */
function getInboxUrgencyDescription(inboxItem: InboxItem): string {
  const hoursOld = Math.floor((Date.now() - parseISO(inboxItem.receivedAt).getTime()) / (1000 * 60 * 60));
  const daysOld = Math.floor(hoursOld / 24);

  if (daysOld === 0) {
    if (hoursOld < 1) {
      return "Received minutes ago";
    }
    return `Received ${hoursOld} hours ago`;
  }
  return `Received ${daysOld} days ago`;
}

/**
 * Get calendar urgency description
 */
function getCalendarUrgencyDescription(event: CalendarEvent): string {
  const hoursUntil = (parseISO(event.startTime).getTime() - Date.now()) / (1000 * 60 * 60);
  const minutesUntil = Math.round(hoursUntil * 60);

  if (minutesUntil < 60) {
    return `Starts in ${minutesUntil} minutes`;
  }
  if (hoursUntil < 24) {
    return `Starts in ${Math.floor(hoursUntil)} hours`;
  }
  const daysUntil = Math.floor(hoursUntil / 24);
  return `Starts in ${daysUntil} days`;
}

/**
 * Get task context labels
 */
function getTaskContextLabels(task: Task): string[] {
  const labels: string[] = [];

  if (task.project?.name) {
    labels.push(`Project: ${task.project.name}`);
  }

  if (task.priority) {
    labels.push(`${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} priority`);
  }

  if (task.category) {
    labels.push(task.category);
  }

  return labels;
}

/**
 * Get inbox context labels
 */
function getInboxContextLabels(inboxItem: InboxItem): string[] {
  const labels: string[] = ["Inbox"];

  if (!inboxItem.isRead) {
    labels.push("Unread");
  }

  if (inboxItem.relatedCompanyName) {
    labels.push(inboxItem.relatedCompanyName);
  }

  return labels;
}
