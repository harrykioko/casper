# Proposed Unified Priority Model

**Document Version:** 1.0
**Last Updated:** 2025-12-08
**Status:** Design Phase

---

## Table of Contents

1. [Vision & Objectives](#vision--objectives)
2. [Unified Priority Model](#unified-priority-model)
3. [Source-to-PriorityItem Mappings](#source-to-priorityitem-mappings)
4. [Scoring Function & Weights](#scoring-function--weights)
5. [Rules & Filters](#rules--filters)
6. [UX & System Behavior](#ux--system-behavior)
7. [Implementation Approach](#implementation-approach)

---

## Vision & Objectives

### The Core Question

When Harry logs into CASPER, the system should answer:

> **"What are the 5–10 highest-leverage next actions I should take right now?"**

### Design Principles

1. **Unified:** All data sources (tasks, inbox, portfolio, pipeline, calendar, reading, nonnegotiables) contribute to a single priority model
2. **Multi-dimensional:** Consider urgency, importance, recency, and commitment—not just deadlines
3. **Explainable:** Every priority item explains *why* it's prioritized
4. **Adaptive:** Learns from user behavior (snoozes, dismissals, completions)
5. **Actionable:** Prioritizes items that can be acted on immediately
6. **Focused:** Shows 5–10 items to prevent overwhelm, with clear next steps

### Success Criteria

✅ **Reduction in blind spots:** Standalone tasks, inbox, calendar, reading all contribute
✅ **Smarter ranking:** High-importance work surfaces above low-importance work
✅ **Time-aware:** Urgency increases as deadlines/events approach
✅ **Relationship-aware:** Company staleness balanced with strategic importance
✅ **Explainable:** Users understand why each item is prioritized
✅ **Extensible:** Easy to add new data sources (e.g., future features like notes, contacts)

---

## Unified Priority Model

### Core TypeScript Interface

```typescript
/**
 * PrioritySourceType
 * All possible sources of priority items in CASPER
 */
export type PrioritySourceType =
  | "task"
  | "inbox"
  | "portfolio_company"
  | "pipeline_company"
  | "calendar_event"
  | "reading_item"
  | "nonnegotiable"
  | "project"; // Future: project milestones, deadlines

/**
 * PriorityItem
 * Normalized representation of any priority signal across all data sources
 */
export interface PriorityItem {
  // Identity
  id: string; // Unique priority item ID (generated)
  sourceType: PrioritySourceType;
  sourceId: string; // Original entity ID in source table

  // Display
  title: string; // Short, action-oriented title (e.g., "Follow up with Acme")
  subtitle?: string; // Secondary context (e.g., "Overdue by 3 days")
  description?: string; // Full description or content
  contextLabels?: string[]; // Tags like ["Portfolio: Cashmere", "High priority", "IC prep"]
  iconType?: PriorityIconType; // Visual indicator (clock, alert, company, email, etc.)

  // Core scoring dimensions (0–1 normalized scores)
  urgencyScore: number; // Time sensitivity (deadlines, event proximity, email age)
  importanceScore: number; // Strategic value, explicit priority, stakes
  recencyScore: number; // How recently it became relevant or was touched
  commitmentScore: number; // Explicit commitments (calendar, nonnegotiables, promises)
  effortScore?: number; // Optional: estimated time to complete (0 = quick, 1 = large)

  // Aggregated priority score (weighted sum of dimensions)
  priorityScore: number; // Final computed score for sorting

  // Timestamps
  dueAt?: string | null; // ISO date for deadlines
  eventStartAt?: string | null; // ISO date for calendar events
  snoozedUntil?: string | null; // ISO date if user snoozed this item
  createdAt?: string; // When the underlying entity was created
  lastTouchedAt?: string; // When it was last updated/interacted with

  // State flags
  isBlocked?: boolean; // Blocked on something else
  isCompleted?: boolean; // Already done
  isSnoozed?: boolean; // User explicitly snoozed
  isOverdue?: boolean; // Past due date
  isDueToday?: boolean; // Due today
  isDueSoon?: boolean; // Due in next 1-3 days

  // Related entities (for context and navigation)
  companyId?: string | null; // Portfolio or pipeline company
  companyName?: string | null;
  companyLogoUrl?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  projectColor?: string | null;

  // Explainability
  reasoning: string; // Human-readable explanation (e.g., "Due tomorrow, high importance, linked to Cashmere IC")
  signals: PrioritySignal[]; // Contributing factors to the score
}

/**
 * PrioritySignal
 * Individual factor contributing to priority score
 */
export interface PrioritySignal {
  source: string; // e.g., "deadline", "staleness", "importance", "recency"
  weight: number; // Contribution to final score (0–1)
  description: string; // Human-readable explanation
  timestamp?: string; // When this signal was last updated
}

/**
 * PriorityIconType
 * Visual indicators for different priority types
 */
export type PriorityIconType =
  | "overdue" // Red triangle
  | "due-today" // Orange clock
  | "due-soon" // Yellow clock
  | "stale-company" // Orange alert
  | "unread-email" // Envelope
  | "upcoming-event" // Calendar
  | "unread-reading" // Book
  | "nonnegotiable" // Star
  | "high-importance"; // Red flag
```

---

## Source-to-PriorityItem Mappings

### 1. Tasks → PriorityItem

**Query:**
```sql
SELECT tasks.*,
       projects.name as project_name, projects.color as project_color,
       companies.name as company_name, companies.logo_url as company_logo_url,
       pipeline_companies.company_name as pipeline_name, pipeline_companies.logo_url as pipeline_logo_url
FROM tasks
LEFT JOIN projects ON tasks.project_id = projects.id
LEFT JOIN companies ON tasks.company_id = companies.id
LEFT JOIN pipeline_companies ON tasks.pipeline_company_id = pipeline_companies.id
WHERE tasks.completed = false
  AND tasks.created_by = $user_id
```

**Mapping Rules:**

| PriorityItem Field | Mapping Logic |
|-------------------|---------------|
| `sourceType` | `"task"` |
| `sourceId` | `task.id` |
| `title` | `task.content` (truncate to 80 chars) |
| `subtitle` | If overdue: "Overdue by X days"<br>If due today: "Due today"<br>If due soon: "Due in X days" |
| `description` | `task.content` (full) |
| `contextLabels` | `[project_name, company_name, priority_label]` |
| `iconType` | If overdue: `"overdue"`<br>If due today: `"due-today"`<br>If due soon: `"due-soon"`<br>Else: `"high-importance"` if priority = high |
| `dueAt` | `task.scheduled_for` |
| `createdAt` | `task.created_at` |
| `lastTouchedAt` | `task.updated_at` |
| `isOverdue` | `scheduled_for < today` |
| `isDueToday` | `scheduled_for === today` |
| `isDueSoon` | `scheduled_for` in next 1-3 days |
| `companyId` | `task.company_id ?? task.pipeline_company_id` |
| `companyName` | `company_name ?? pipeline_name` |
| `companyLogoUrl` | `company_logo_url ?? pipeline_logo_url` |
| `projectId` | `task.project_id` |
| `projectName` | `project_name` |
| `projectColor` | `project_color` |

**Scoring Logic:**

```typescript
// Urgency: Based on deadline proximity
if (task.scheduled_for) {
  const daysUntilDue = differenceInDays(parseISO(task.scheduled_for), now);
  if (daysUntilDue < 0) {
    // Overdue: max urgency, increasing with age
    urgencyScore = Math.min(1.0, 0.9 + Math.abs(daysUntilDue) * 0.02); // Caps at 1.0
  } else if (daysUntilDue === 0) {
    // Due today: very high urgency
    urgencyScore = 0.9;
  } else if (daysUntilDue <= 1) {
    // Due tomorrow
    urgencyScore = 0.7;
  } else if (daysUntilDue <= 3) {
    // Due within 3 days
    urgencyScore = 0.5;
  } else if (daysUntilDue <= 7) {
    // Due within a week
    urgencyScore = 0.3;
  } else {
    // More than a week away
    urgencyScore = 0.1;
  }
} else {
  // No due date
  urgencyScore = 0.2; // Default low urgency
}

// Importance: Based on explicit priority + company context
let importanceScore = 0.3; // Default
if (task.priority === "high") {
  importanceScore = 0.9;
} else if (task.priority === "medium") {
  importanceScore = 0.6;
} else if (task.priority === "low") {
  importanceScore = 0.3;
}

// Boost importance if linked to portfolio/pipeline company
if (task.company_id || task.pipeline_company_id) {
  importanceScore += 0.2; // Company-linked tasks are more important
}
importanceScore = Math.min(1.0, importanceScore); // Cap at 1.0

// Recency: Based on last update
const daysSinceUpdate = differenceInDays(now, parseISO(task.updated_at));
if (daysSinceUpdate === 0) {
  recencyScore = 1.0; // Updated today
} else if (daysSinceUpdate <= 1) {
  recencyScore = 0.8; // Updated yesterday
} else if (daysSinceUpdate <= 3) {
  recencyScore = 0.5; // Updated in last 3 days
} else if (daysSinceUpdate <= 7) {
  recencyScore = 0.3; // Updated in last week
} else {
  recencyScore = 0.1; // Stale task
}

// Commitment: Tasks are implicit commitments
commitmentScore = 0.4; // Default commitment level

// Effort: If we add time estimates in future
effortScore = undefined; // Not yet implemented

// Reasoning
let reasoning = "";
if (isOverdue) {
  reasoning += `Overdue by ${Math.abs(daysUntilDue)} days. `;
} else if (isDueToday) {
  reasoning += "Due today. ";
} else if (isDueSoon) {
  reasoning += `Due in ${daysUntilDue} days. `;
}
if (task.priority === "high") {
  reasoning += "High priority. ";
}
if (companyName) {
  reasoning += `Linked to ${companyName}. `;
}
if (daysSinceUpdate > 7) {
  reasoning += `Not updated in ${daysSinceUpdate} days.`;
}

// Signals
signals = [
  { source: "deadline", weight: urgencyScore, description: `Urgency based on due date` },
  { source: "importance", weight: importanceScore, description: `${task.priority || "default"} priority` },
  { source: "recency", weight: recencyScore, description: `Last updated ${daysSinceUpdate} days ago` },
  { source: "commitment", weight: commitmentScore, description: "Task commitment" },
];
```

**Examples:**

| Task | Urgency | Importance | Recency | Reasoning |
|------|---------|------------|---------|-----------|
| "Call Acme CEO re: bridge round" (overdue 3 days, high priority, linked to portfolio, updated 3 days ago) | 0.96 | 1.0 | 0.5 | "Overdue by 3 days. High priority. Linked to Acme." |
| "Update CRM logo" (due in 5 days, low priority, no company, updated today) | 0.3 | 0.3 | 1.0 | "Due in 5 days. Low priority." |
| "Prepare IC deck" (due tomorrow, medium priority, linked to pipeline, updated yesterday) | 0.7 | 0.8 | 0.8 | "Due tomorrow. Medium priority. Linked to Beta Inc." |

---

### 2. Inbox Items → PriorityItem

**Query:**
```sql
SELECT inbox_items.*,
       companies.name as company_name, companies.logo_url as company_logo_url
FROM inbox_items
LEFT JOIN companies ON inbox_items.related_company_id = companies.id
WHERE inbox_items.is_resolved = false
  AND inbox_items.is_deleted = false
  AND (inbox_items.snoozed_until IS NULL OR inbox_items.snoozed_until <= NOW())
  AND inbox_items.created_by = $user_id
ORDER BY inbox_items.received_at DESC
```

**Mapping Rules:**

| PriorityItem Field | Mapping Logic |
|-------------------|---------------|
| `sourceType` | `"inbox"` |
| `sourceId` | `inbox_item.id` |
| `title` | `inbox_item.subject` (truncate to 80 chars) |
| `subtitle` | `from_name` or `from_email` |
| `description` | `inbox_item.snippet` or `text_body` (preview) |
| `contextLabels` | `[company_name, "Unread" if !is_read]` |
| `iconType` | `"unread-email"` |
| `createdAt` | `inbox_item.received_at` |
| `lastTouchedAt` | `inbox_item.updated_at` |
| `isSnoozed` | `inbox_item.snoozed_until != null` |
| `companyId` | `inbox_item.related_company_id` |
| `companyName` | `company_name` |
| `companyLogoUrl` | `company_logo_url` |

**Scoring Logic:**

```typescript
// Urgency: Based on email age
const hoursOld = differenceInHours(now, parseISO(inbox_item.received_at));
if (hoursOld < 4) {
  urgencyScore = 1.0; // Very recent
} else if (hoursOld < 24) {
  urgencyScore = 0.8; // Same day
} else if (hoursOld < 48) {
  urgencyScore = 0.6; // 1-2 days old
} else if (hoursOld < 72) {
  urgencyScore = 0.4; // 2-3 days old
} else {
  urgencyScore = 0.2; // Older than 3 days
}

// Importance: Based on sender and company context
let importanceScore = 0.5; // Default
if (inbox_item.related_company_id) {
  importanceScore = 0.7; // Company-related emails are more important
}
// Future: Could boost for known important senders (LPs, CEOs, etc.)

// Recency: Same as urgency for emails (freshness matters)
recencyScore = urgencyScore;

// Commitment: Unread emails imply a need to respond
commitmentScore = inbox_item.is_read ? 0.3 : 0.6;

// Reasoning
let reasoning = "";
const daysOld = Math.floor(hoursOld / 24);
if (daysOld === 0) {
  reasoning += "Received today. ";
} else {
  reasoning += `Received ${daysOld} days ago. `;
}
if (!inbox_item.is_read) {
  reasoning += "Unread. ";
}
if (companyName) {
  reasoning += `From ${companyName}. `;
}
reasoning += "Needs response or resolution.";

// Signals
signals = [
  { source: "email_age", weight: urgencyScore, description: `Email age: ${daysOld} days` },
  { source: "importance", weight: importanceScore, description: companyName ? `Related to ${companyName}` : "General inquiry" },
  { source: "unread", weight: commitmentScore, description: inbox_item.is_read ? "Read" : "Unread" },
];
```

**Examples:**

| Inbox Item | Urgency | Importance | Reasoning |
|------------|---------|------------|-----------|
| Email from LP: "Can you send Q3 report?" (received 2 hours ago, unread, no company link) | 1.0 | 0.5 | "Received today. Unread. Needs response or resolution." |
| Email from Acme CEO: "Let's discuss next steps" (received 1 day ago, read, linked to Acme) | 0.8 | 0.7 | "Received 1 day ago. From Acme. Needs response or resolution." |
| Newsletter: "Tech trends 2025" (received 5 days ago, unread) | 0.2 | 0.5 | "Received 5 days ago. Unread." |

---

### 3. Portfolio Companies → PriorityItem

**Query:**
```sql
SELECT companies.id, companies.name, companies.logo_url, companies.last_interaction_at, companies.status,
       COUNT(tasks.id) FILTER (WHERE tasks.completed = false) as open_task_count,
       MIN(tasks.scheduled_for) FILTER (WHERE tasks.completed = false) as next_task_due
FROM companies
LEFT JOIN tasks ON tasks.company_id = companies.id
WHERE companies.kind = 'portfolio'
  AND companies.created_by = $user_id
  AND companies.status != 'archived' -- Don't prioritize archived companies
GROUP BY companies.id
```

**Mapping Rules:**

| PriorityItem Field | Mapping Logic |
|-------------------|---------------|
| `sourceType` | `"portfolio_company"` |
| `sourceId` | `company.id` |
| `title` | `company.name` |
| `subtitle` | `"No contact in X days"` or `"Y open tasks"` |
| `description` | Summary of interaction status + task status |
| `contextLabels` | `["Portfolio", status, "X open tasks"]` |
| `iconType` | `"stale-company"` |
| `lastTouchedAt` | `company.last_interaction_at` |
| `companyId` | `company.id` |
| `companyName` | `company.name` |
| `companyLogoUrl` | `company.logo_url` |

**Scoring Logic:**

```typescript
// Urgency: Based on interaction staleness + next task due
let urgencyScore = 0.3; // Default base urgency

// Interaction staleness
const daysSinceInteraction = company.last_interaction_at
  ? differenceInDays(now, parseISO(company.last_interaction_at))
  : 999; // Treat null as very stale

if (daysSinceInteraction > 60) {
  urgencyScore = 0.8; // Very stale
} else if (daysSinceInteraction > 30) {
  urgencyScore = 0.6; // Stale
} else if (daysSinceInteraction > 14) {
  urgencyScore = 0.4; // Getting stale
} else {
  urgencyScore = 0.2; // Recent contact
}

// Next task urgency (if any)
if (next_task_due) {
  const daysUntilTask = differenceInDays(parseISO(next_task_due), now);
  if (daysUntilTask < 0) {
    urgencyScore = Math.max(urgencyScore, 0.9); // Overdue task
  } else if (daysUntilTask === 0) {
    urgencyScore = Math.max(urgencyScore, 0.8); // Task due today
  } else if (daysUntilTask <= 3) {
    urgencyScore = Math.max(urgencyScore, 0.5); // Task due soon
  }
}

// Importance: Based on company status and strategic value
let importanceScore = 0.5; // Default
if (company.status === "active") {
  importanceScore = 0.8; // Active portfolio companies are high importance
} else if (company.status === "watching") {
  importanceScore = 0.5;
} else if (company.status === "exited") {
  importanceScore = 0.3; // Lower priority
}

// Boost importance if company has open tasks
if (open_task_count > 0) {
  importanceScore += 0.2;
  importanceScore = Math.min(1.0, importanceScore);
}

// Recency: Based on last interaction
recencyScore = daysSinceInteraction > 30 ? 0.1 : (daysSinceInteraction > 14 ? 0.3 : 0.6);

// Commitment: Portfolio companies are ongoing commitments
commitmentScore = 0.6;

// Reasoning
let reasoning = "";
if (daysSinceInteraction === 999) {
  reasoning += "No recorded interactions. ";
} else if (daysSinceInteraction > 30) {
  reasoning += `No contact in ${daysSinceInteraction} days. `;
} else if (daysSinceInteraction > 14) {
  reasoning += `Last contact ${daysSinceInteraction} days ago. `;
}
if (open_task_count > 0) {
  reasoning += `${open_task_count} open task${open_task_count > 1 ? 's' : ''}. `;
}
if (next_task_due) {
  const daysUntilTask = differenceInDays(parseISO(next_task_due), now);
  if (daysUntilTask < 0) {
    reasoning += `Overdue task.`;
  } else if (daysUntilTask === 0) {
    reasoning += `Task due today.`;
  }
}
reasoning += ` Active portfolio company.`;

// Signals
signals = [
  { source: "staleness", weight: urgencyScore, description: `${daysSinceInteraction} days since interaction` },
  { source: "importance", weight: importanceScore, description: `${company.status} portfolio company` },
  { source: "tasks", weight: open_task_count > 0 ? 0.3 : 0, description: `${open_task_count} open tasks` },
];
```

**Examples:**

| Portfolio Company | Urgency | Importance | Reasoning |
|-------------------|---------|------------|-----------|
| Acme (active, no contact in 45 days, 2 open tasks, 1 overdue) | 0.9 | 1.0 | "No contact in 45 days. 2 open tasks. Overdue task. Active portfolio company." |
| Beta (watching, last contact 10 days ago, 0 open tasks) | 0.2 | 0.5 | "Last contact 10 days ago. Active portfolio company." |
| Gamma (exited, no contact in 20 days, 1 task due today) | 0.8 | 0.5 | "No contact in 20 days. 1 open task. Task due today. Active portfolio company." |

---

### 4. Pipeline Companies → PriorityItem

**Similar to Portfolio, with adjustments:**

**Scoring Adjustments:**

```typescript
// Importance: Based on is_top_of_mind, status, and close_date
let importanceScore = 0.4; // Default

if (pipeline.is_top_of_mind) {
  importanceScore = 0.9; // Top of mind = high importance
} else if (pipeline.status === "active") {
  importanceScore = 0.6;
} else if (pipeline.status === "interesting") {
  importanceScore = 0.5;
} else if (pipeline.status === "passed") {
  importanceScore = 0.1; // Deprioritize passed deals
}

// Boost if close_date is soon
if (pipeline.close_date) {
  const daysUntilClose = differenceInDays(parseISO(pipeline.close_date), now);
  if (daysUntilClose < 7) {
    importanceScore = Math.min(1.0, importanceScore + 0.3);
  } else if (daysUntilClose < 30) {
    importanceScore = Math.min(1.0, importanceScore + 0.1);
  }
}

// Urgency: Consider close_date in addition to staleness
if (pipeline.close_date) {
  const daysUntilClose = differenceInDays(parseISO(pipeline.close_date), now);
  if (daysUntilClose < 0) {
    urgencyScore = Math.max(urgencyScore, 0.9); // Past close date
  } else if (daysUntilClose <= 7) {
    urgencyScore = Math.max(urgencyScore, 0.7); // Close date within a week
  } else if (daysUntilClose <= 30) {
    urgencyScore = Math.max(urgencyScore, 0.5); // Close date within a month
  }
}
```

---

### 5. Calendar Events → PriorityItem

**Query:**
```sql
SELECT calendar_events.*
FROM calendar_events
WHERE calendar_events.user_id = $user_id
  AND calendar_events.start_time >= NOW() - INTERVAL '1 hour' -- Events started in last hour or future
  AND calendar_events.start_time <= NOW() + INTERVAL '2 days' -- Events in next 48 hours
ORDER BY calendar_events.start_time ASC
LIMIT 20
```

**Mapping Rules:**

| PriorityItem Field | Mapping Logic |
|-------------------|---------------|
| `sourceType` | `"calendar_event"` |
| `sourceId` | `event.id` |
| `title` | `event.title` |
| `subtitle` | `"Event at " + formatTime(event.start_time)` |
| `description` | `event.description` + attendee summary |
| `contextLabels` | `["Calendar", event.category]` |
| `iconType` | `"upcoming-event"` |
| `eventStartAt` | `event.start_time` |
| `createdAt` | `event.created_at` |

**Scoring Logic:**

```typescript
// Urgency: Based on proximity to event start
const hoursUntilEvent = differenceInHours(parseISO(event.start_time), now);

if (hoursUntilEvent < 0) {
  urgencyScore = 0.5; // Event already started (maybe prep for post-meeting follow-up)
} else if (hoursUntilEvent < 1) {
  urgencyScore = 1.0; // Starting within the hour
} else if (hoursUntilEvent < 4) {
  urgencyScore = 0.9; // Starting in next few hours
} else if (hoursUntilEvent < 24) {
  urgencyScore = 0.7; // Today
} else if (hoursUntilEvent < 48) {
  urgencyScore = 0.5; // Tomorrow
} else {
  urgencyScore = 0.3; // 2+ days away
}

// Importance: Based on attendee count, event type
let importanceScore = 0.6; // Default for meetings
if (event.attendees && event.attendees.length > 5) {
  importanceScore = 0.8; // Large meetings
} else if (event.attendees && event.attendees.length > 2) {
  importanceScore = 0.7; // Group meetings
}
// Future: Could detect LP meetings, IC meetings, etc. from title

// Recency: Not applicable to future events
recencyScore = 0.5;

// Commitment: Calendar events are explicit commitments
commitmentScore = 1.0; // Highest commitment

// Reasoning
const minutesUntil = Math.round(hoursUntilEvent * 60);
let reasoning = "";
if (minutesUntil < 60) {
  reasoning += `Starts in ${minutesUntil} minutes. `;
} else if (hoursUntilEvent < 24) {
  reasoning += `Starts at ${format(parseISO(event.start_time), 'h:mm a')} today. `;
} else {
  reasoning += `Starts ${format(parseISO(event.start_time), 'MMM d, h:mm a')}. `;
}
if (event.attendees && event.attendees.length > 0) {
  reasoning += `${event.attendees.length} attendees. `;
}
reasoning += "Calendar commitment.";

// Signals
signals = [
  { source: "event_proximity", weight: urgencyScore, description: `Event in ${hoursUntilEvent} hours` },
  { source: "commitment", weight: commitmentScore, description: "Calendar commitment" },
];
```

**Examples:**

| Calendar Event | Urgency | Importance | Commitment | Reasoning |
|----------------|---------|------------|------------|-----------|
| "IC Meeting: Acme" (in 30 minutes, 8 attendees) | 1.0 | 0.8 | 1.0 | "Starts in 30 minutes. 8 attendees. Calendar commitment." |
| "1:1 with Jane" (in 6 hours, 2 attendees) | 0.9 | 0.7 | 1.0 | "Starts at 2:00 PM today. 2 attendees. Calendar commitment." |
| "Planning session" (tomorrow at 10 AM) | 0.5 | 0.6 | 1.0 | "Starts Jan 9, 10:00 AM. Calendar commitment." |

---

### 6. Reading Items → PriorityItem

**Query:**
```sql
SELECT reading_items.*,
       projects.name as project_name, projects.color as project_color
FROM reading_items
LEFT JOIN projects ON reading_items.project_id = projects.id
WHERE reading_items.is_read = false OR reading_items.is_read IS NULL
  AND reading_items.created_by = $user_id
ORDER BY reading_items.created_at DESC
LIMIT 50
```

**Mapping Rules:**

| PriorityItem Field | Mapping Logic |
|-------------------|---------------|
| `sourceType` | `"reading_item"` |
| `sourceId` | `reading_item.id` |
| `title` | `reading_item.title` |
| `subtitle` | `reading_item.hostname` |
| `description` | `reading_item.description` |
| `contextLabels` | `[project_name, "Unread"]` |
| `iconType` | `"unread-reading"` |
| `createdAt` | `reading_item.created_at` |
| `projectId` | `reading_item.project_id` |
| `projectName` | `project_name` |

**Scoring Logic:**

```typescript
// Urgency: Reading is generally lower urgency unless context-specific
let urgencyScore = 0.2; // Default low urgency

// Boost urgency if project-linked (implies purpose)
if (reading_item.project_id) {
  urgencyScore = 0.4;
}

// Importance: Based on project context
let importanceScore = 0.3; // Default
if (reading_item.project_id) {
  importanceScore = 0.6; // Project-linked reading is more important
}

// Recency: Freshly bookmarked items are more relevant
const daysSinceCreated = differenceInDays(now, parseISO(reading_item.created_at));
if (daysSinceCreated === 0) {
  recencyScore = 1.0;
} else if (daysSinceCreated <= 3) {
  recencyScore = 0.7;
} else if (daysSinceCreated <= 7) {
  recencyScore = 0.4;
} else {
  recencyScore = 0.1; // Old bookmarks decay
}

// Commitment: Low unless project-linked
commitmentScore = reading_item.project_id ? 0.4 : 0.2;

// Reasoning
let reasoning = "";
if (daysSinceCreated === 0) {
  reasoning += "Saved today. ";
} else {
  reasoning += `Saved ${daysSinceCreated} days ago. `;
}
reasoning += "Unread. ";
if (projectName) {
  reasoning += `Related to ${projectName} project.`;
} else {
  reasoning += "General interest.";
}

// Signals
signals = [
  { source: "recency", weight: recencyScore, description: `Saved ${daysSinceCreated} days ago` },
  { source: "importance", weight: importanceScore, description: projectName ? `Linked to ${projectName}` : "General reading" },
];
```

**Note:** Reading items generally have lower priority scores unless explicitly linked to projects or given context.

---

### 7. Nonnegotiables → PriorityItem

**Query:**
```sql
SELECT nonnegotiables.*,
       projects.name as project_name, projects.color as project_color
FROM nonnegotiables
WHERE nonnegotiables.is_active = true
  AND nonnegotiables.created_by = $user_id
```

**Mapping Rules:**

| PriorityItem Field | Mapping Logic |
|-------------------|---------------|
| `sourceType` | `"nonnegotiable"` |
| `sourceId` | `nonnegotiable.id` |
| `title` | `nonnegotiable.title` |
| `subtitle` | `nonnegotiable.frequency` (e.g., "Daily", "Weekly") |
| `description` | `nonnegotiable.description` |
| `contextLabels` | `[project_name, frequency]` |
| `iconType` | `"nonnegotiable"` |
| `createdAt` | `nonnegotiable.created_at` |

**Scoring Logic:**

```typescript
// Urgency: Based on reminder_time today (if applicable)
let urgencyScore = 0.5; // Default moderate urgency

// If reminder_time is set and is today
if (nonnegotiable.reminder_time) {
  const reminderToday = set(now, {
    hours: parseISO(`1970-01-01T${nonnegotiable.reminder_time}`).getHours(),
    minutes: parseISO(`1970-01-01T${nonnegotiable.reminder_time}`).getMinutes(),
  });
  const hoursUntilReminder = differenceInHours(reminderToday, now);

  if (hoursUntilReminder < 0) {
    urgencyScore = 0.7; // Reminder passed today
  } else if (hoursUntilReminder < 2) {
    urgencyScore = 0.9; // Reminder soon
  } else {
    urgencyScore = 0.5; // Later today
  }
}

// Importance: Nonnegotiables are self-commitments with high importance
importanceScore = 0.7;

// Recency: Not applicable
recencyScore = 0.5;

// Commitment: Very high (explicit personal commitments)
commitmentScore = 1.0;

// Reasoning
let reasoning = "Personal commitment. ";
if (nonnegotiable.frequency) {
  reasoning += `${nonnegotiable.frequency}. `;
}
if (nonnegotiable.reminder_time) {
  reasoning += `Reminder at ${format(parseISO(`1970-01-01T${nonnegotiable.reminder_time}`), 'h:mm a')}.`;
}

// Signals
signals = [
  { source: "commitment", weight: commitmentScore, description: "Nonnegotiable habit" },
  { source: "importance", weight: importanceScore, description: "Personal commitment" },
];
```

**Examples:**

| Nonnegotiable | Urgency | Importance | Commitment | Reasoning |
|---------------|---------|------------|------------|-----------|
| "Exercise 30 min" (daily, reminder at 7 AM, current time 6:45 AM) | 0.9 | 0.7 | 1.0 | "Personal commitment. Daily. Reminder at 7:00 AM." |
| "Weekly review" (weekly, no reminder) | 0.5 | 0.7 | 1.0 | "Personal commitment. Weekly." |

---

## Scoring Function & Weights

### Baseline Scoring Formula

```typescript
/**
 * Compute final priority score from multi-dimensional scores
 */
function computePriorityScore(item: {
  urgencyScore: number;
  importanceScore: number;
  recencyScore: number;
  commitmentScore: number;
  effortScore?: number;
}): number {
  // Baseline weights (sum to 1.0 for normalization)
  const w_urgency = 0.35; // Deadlines and time sensitivity
  const w_importance = 0.30; // Strategic value and explicit priority
  const w_recency = 0.15; // How recently it became relevant
  const w_commitment = 0.20; // Explicit commitments (calendar, nonnegotiables)
  const w_effort = 0.00; // Optional: quick wins boost (not yet implemented)

  let score =
    w_urgency * item.urgencyScore +
    w_importance * item.importanceScore +
    w_recency * item.recencyScore +
    w_commitment * item.commitmentScore;

  // Optional: Adjust for effort (quick wins get slight boost)
  if (item.effortScore !== undefined) {
    // Inverse effort: lower effort = higher score
    score += w_effort * (1 - item.effortScore);
  }

  // Penalties
  // (None for now, but could penalize for: blocked, repeatedly snoozed, etc.)

  return score;
}
```

### Weight Rationale

| Weight | Value | Reasoning |
|--------|-------|-----------|
| **Urgency** | 35% | Time sensitivity is the primary driver of "what needs attention now." Deadlines, overdue tasks, and upcoming events create pressure. |
| **Importance** | 30% | Strategic value ensures high-stakes work surfaces above low-stakes work. Prevents administrative tasks from drowning out critical decisions. |
| **Recency** | 15% | Freshly created or updated items are more likely to be top-of-mind and actionable. Prevents stale tasks from dominating. |
| **Commitment** | 20% | Explicit commitments (calendar events, nonnegotiables, promises to others) must be honored. Higher commitment = higher priority. |
| **Effort** | 0% | Future: Could boost quick wins (2-minute tasks) to encourage progress. Not yet implemented. |

### Adaptive Weights (Future)

In a future ML-driven version, weights could be learned from user behavior:
- If user consistently snoozes low-importance items, decrease `w_importance`
- If user always completes calendar prep tasks, increase `w_commitment`
- If user ignores stale reading items, decrease recency weight for reading sources

---

## Rules & Filters

### Pre-Score Filters (Exclusions)

Before computing scores, exclude items that should **never** appear in priority list:

```typescript
function shouldExcludeFromPriority(item: any, sourceType: PrioritySourceType): boolean {
  // 1. Snoozed items (until snoozed_until timestamp passes)
  if (item.snoozed_until && parseISO(item.snoozed_until) > now) {
    return true;
  }

  // 2. Completed/resolved items
  if (sourceType === "task" && item.completed) return true;
  if (sourceType === "inbox" && item.is_resolved) return true;

  // 3. Archived entities
  if (sourceType === "portfolio_company" && item.status === "archived") return true;
  if (sourceType === "pipeline_company" && item.status === "passed") return true;

  // 4. Inactive nonnegotiables
  if (sourceType === "nonnegotiable" && !item.is_active) return true;

  // 5. Past calendar events (>1 hour ago)
  if (sourceType === "calendar_event") {
    const hoursSinceStart = differenceInHours(now, parseISO(item.start_time));
    if (hoursSinceStart > 1) return true;
  }

  return false;
}
```

---

### Post-Score Filters (Inclusions & Ranking)

After scoring, apply rules to ensure a focused, actionable list:

#### Rule 1: Always Include High-Stakes Items

Certain items always appear regardless of score:

```typescript
function isAlwaysInclude(item: PriorityItem): boolean {
  // 1. Overdue high-importance tasks
  if (item.sourceType === "task" && item.isOverdue && item.importanceScore >= 0.8) {
    return true;
  }

  // 2. Calendar events starting within 2 hours
  if (item.sourceType === "calendar_event" && item.eventStartAt) {
    const hoursUntil = differenceInHours(parseISO(item.eventStartAt), now);
    if (hoursUntil >= 0 && hoursUntil < 2) {
      return true;
    }
  }

  // 3. Today's active nonnegotiables
  if (item.sourceType === "nonnegotiable" && item.urgencyScore >= 0.5) {
    return true;
  }

  return false;
}
```

#### Rule 2: Limit List Size with Diversity

```typescript
function selectTopPriorityItems(
  allItems: PriorityItem[],
  maxItems: number = 10
): PriorityItem[] {
  // Step 1: Separate "always include" items
  const alwaysIncluded = allItems.filter(isAlwaysInclude);
  const remaining = allItems.filter(item => !isAlwaysInclude(item));

  // Step 2: Sort remaining by priorityScore descending
  remaining.sort((a, b) => b.priorityScore - a.priorityScore);

  // Step 3: Ensure source diversity (don't show 10 reading items)
  const selected: PriorityItem[] = [...alwaysIncluded];
  const sourceTypeCounts = new Map<PrioritySourceType, number>();

  for (const item of remaining) {
    if (selected.length >= maxItems) break;

    const count = sourceTypeCounts.get(item.sourceType) || 0;

    // Allow max 3 items from same source type (unless always-include)
    if (count < 3) {
      selected.push(item);
      sourceTypeCounts.set(item.sourceType, count + 1);
    }
  }

  // Step 4: Final sort by priorityScore
  selected.sort((a, b) => b.priorityScore - a.priorityScore);

  return selected.slice(0, maxItems);
}
```

#### Rule 3: Deprioritize Low-Score Items

```typescript
function applyScoreThreshold(items: PriorityItem[]): PriorityItem[] {
  // Filter out items with very low priority scores (below 0.3)
  // These are "nice to have" but not actionable priorities
  return items.filter(item => item.priorityScore >= 0.3 || isAlwaysInclude(item));
}
```

---

### Summary of Rules

| Rule | Purpose | Logic |
|------|---------|-------|
| **Always Include** | Critical items never get filtered | Overdue high-priority tasks, imminent calendar events, today's nonnegotiables |
| **Diversity Limit** | Prevent one source from dominating | Max 3 items per source type |
| **Size Limit** | Keep list focused | Max 5–10 items total |
| **Score Threshold** | Filter noise | Exclude items with priority score < 0.3 |
| **Exclusions** | Remove non-actionable items | Snoozed, completed, archived, past events |

---

## UX & System Behavior

### What the User Sees

#### On Login / Dashboard Load

**Priority Section:**
- Header: "What needs your attention" (5–10 items)
- Each item shows:
  - Icon (overdue, due today, email, calendar, etc.)
  - Title (action-oriented)
  - Subtitle (context: company, project, time)
  - Reasoning (hover or expand to see explanation)
  - Quick actions: Snooze, Dismiss, Mark Done, Open

**Example:**

```
📌 What needs your attention

🔺 Follow up with Acme re: bridge round
   Portfolio: Acme · Overdue by 3 days
   [Reasoning: Overdue by 3 days. High priority. Linked to Acme. Priority score: 0.92]
   [Snooze ▼] [✓ Done] [Open →]

🔔 IC Meeting: Acme
   Calendar · Starts in 30 minutes
   [Reasoning: Starts in 30 minutes. 8 attendees. Calendar commitment. Priority score: 0.88]
   [Open →]

📧 Email from LP: "Can you send Q3 report?"
   Inbox · Received today · Unread
   [Reasoning: Received today. Unread. Needs response or resolution. Priority score: 0.81]
   [Snooze ▼] [✓ Resolve] [Open →]

⏰ Prepare IC deck
   Task · Due tomorrow · Pipeline: Beta Inc
   [Reasoning: Due tomorrow. High priority. Linked to Beta Inc. Priority score: 0.78]
   [Snooze ▼] [✓ Done] [Open →]

⚠️ Cashmere
   Portfolio · No contact in 45 days · 2 open tasks
   [Reasoning: No contact in 45 days. 2 open tasks. Overdue task. Active portfolio company. Priority score: 0.72]
   [Log interaction] [Create task] [Open →]
```

---

### Interaction Model

#### 1. Snooze

**User Action:** Click "Snooze" dropdown, select time (1 hour, 3 hours, tomorrow, next week, custom)

**System Behavior:**
- Set `snoozed_until` timestamp on underlying entity
- Remove from priority list until `snoozed_until` passes
- Track snooze count and duration (for future learning)

**Feedback Loop:**
- If user repeatedly snoozes similar items (e.g., reading items), decrease their importance weight
- If user never snoozes certain types (e.g., overdue tasks), increase their urgency weight

---

#### 2. Dismiss / Mark Done

**User Action:** Click "Done" or "Resolve"

**System Behavior:**
- For tasks: Set `completed = true`
- For inbox: Set `is_resolved = true`
- For companies: Log an interaction (optional prompt)
- Remove from priority list immediately
- Track completion time relative to priority score (for learning)

**Feedback Loop:**
- Items marked done quickly indicate accurate prioritization
- Items marked done after repeated views indicate hesitation or friction

---

#### 3. Open / Navigate

**User Action:** Click item or "Open" button

**System Behavior:**
- Navigate to detail view (task modal, company page, inbox item, calendar event)
- Track `last_viewed_at` timestamp
- Update recency score for future priority calculations

---

### Time Dynamics

#### Throughout the Day

The priority list adapts as time passes:

**Morning (7 AM):**
- Nonnegotiables appear: "Exercise 30 min" (reminder at 7 AM)
- Today's tasks surface: "Review deck" (due today)
- Calendar events: "1:1 with Jane" (starts at 9 AM)

**Mid-Day (12 PM):**
- Urgency increases for afternoon events: "IC Meeting" (starts at 2 PM) moves to top
- Morning nonnegotiables completed (removed)
- New inbox items: "Email from LP" (received 11:30 AM) appears

**Evening (6 PM):**
- Past events removed from list
- Overdue tasks remain: "Follow up with Acme" (due yesterday)
- Tomorrow's tasks appear with moderate urgency: "Prepare materials" (due tomorrow)

**Formula:**
- Priority scores are **recalculated in real-time** as timestamps change
- No static list—dynamic re-ranking every load

---

### Recency Decay

Old items naturally decay in priority unless they have explicit deadlines:

**Example: Task without deadline**
- Day 1: Created today → `recencyScore = 1.0`
- Day 3: Updated 3 days ago → `recencyScore = 0.5`
- Day 7: Updated 7 days ago → `recencyScore = 0.3`
- Day 14: Updated 14 days ago → `recencyScore = 0.1`

**Result:** Stale tasks without deadlines fade away unless user explicitly re-engages.

---

### Explainability

Every priority item includes a `reasoning` field:

**Example Reasoning Strings:**
- "Overdue by 3 days. High priority. Linked to Acme."
- "Due tomorrow. Medium priority. Linked to Beta Inc."
- "Starts in 30 minutes. 8 attendees. Calendar commitment."
- "Received today. Unread. Needs response or resolution."
- "No contact in 45 days. 2 open tasks. Overdue task. Active portfolio company."

**Display Options:**
- Show inline as subtitle (compact)
- Show on hover (tooltip)
- Show on expand (detailed view with signal breakdown)

---

### User Feedback & Learning

#### Implicit Signals

Track user behavior to refine scoring over time:

| Action | Signal | Adjustment |
|--------|--------|------------|
| User completes item quickly | High-quality priority | Increase weights for similar items |
| User snoozes item repeatedly | Over-prioritized | Decrease weights for similar items |
| User ignores item (never clicks) | Not actually important | Decrease source importance |
| User marks as done before due date | Good prioritization | Maintain weights |
| User dismisses overdue item | Late but low stakes | Decrease importance for similar tasks |

#### Explicit Feedback (Future)

- "Was this helpful?" thumbs up/down on each priority item
- "What's missing?" button to surface blind spots

---

## Implementation Approach

### Phase 1: Foundation (No Behavior Changes)

**Goal:** Document, design, and create types without changing runtime behavior.

**Deliverables:**
1. ✅ `docs/priority_system/01_current_state.md` - Current system analysis
2. ✅ `docs/priority_system/02_proposed_model.md` - This document
3. `src/types/priority.ts` - New TypeScript interfaces (`PriorityItem`, `PrioritySignal`, `PrioritySourceType`)
4. `src/lib/priority/` - New directory for priority logic:
   - `src/lib/priority/priorityMapping.ts` - Skeleton mapping functions (stubbed)
   - `src/lib/priority/priorityScoring.ts` - Skeleton scoring functions (stubbed)
   - `src/lib/priority/priorityRules.ts` - Skeleton filtering functions (stubbed)
5. Comments in existing code:
   - `src/hooks/usePriorityItems.ts` - Add comment: "// TODO: See docs/priority_system/02_proposed_model.md for unified model"
   - `src/hooks/useCompanyAttention.ts` - Add comment: "// TODO: Integrate into unified priority model"

**No Changes To:**
- Existing hooks (`usePriorityItems`, `useCompanyAttention`)
- Existing components (`DashboardPrioritySection`, `CompaniesCommandPane`)
- Existing queries or data fetching

---

### Phase 2: Parallel Implementation (Future)

**Goal:** Build new priority pipeline alongside existing system.

**Approach:**
1. Create `useUnifiedPriority()` hook that:
   - Fetches data from all sources (tasks, inbox, portfolio, pipeline, calendar, reading, nonnegotiables)
   - Maps each source to `PriorityItem[]`
   - Scores each item
   - Applies rules and filters
   - Returns top 5–10 items
2. Add feature flag: `ENABLE_UNIFIED_PRIORITY` (default `false`)
3. In `DashboardPrioritySection`, conditionally render:
   - If flag enabled: Use `useUnifiedPriority()`
   - If flag disabled: Use existing `usePriorityItems()`
4. Add debug view to compare old vs new priority lists side-by-side

**Testing:**
- Validate that new model includes all sources
- Verify scoring logic with real user data
- Compare old vs new lists for coverage and accuracy

---

### Phase 3: Gradual Rollout (Future)

**Goal:** Replace old system with new, add UI enhancements, gather feedback.

**Steps:**
1. Enable `ENABLE_UNIFIED_PRIORITY` for internal testing
2. Add explanations UI (reasoning field, signal breakdown)
3. Add snooze persistence (update entities with `snoozed_until`)
4. Add feedback mechanisms (thumbs up/down, "what's missing?")
5. Monitor user behavior (completion rates, snooze patterns)
6. Iterate on weights based on feedback
7. Full rollout: Remove feature flag, delete old `usePriorityItems` logic

---

### Phase 4: Learning & Optimization (Future)

**Goal:** Make the system adaptive and personalized.

**Approach:**
1. Track user actions (completions, snoozes, dismissals)
2. Store interaction history (which items were shown, which were acted on)
3. Train a lightweight model to adjust weights per user
4. Implement A/B testing for weight variations
5. Continuously refine scoring based on aggregate user behavior

**Example Learnings:**
- "Harry always completes tasks linked to portfolio companies first" → Increase `w_importance` for company-linked tasks
- "Harry ignores reading items" → Decrease `w_recency` for reading source
- "Harry completes nonnegotiables consistently" → Maintain high `w_commitment` for nonnegotiables

---

## Summary

This proposed model creates a **unified, multi-dimensional, explainable priority system** that:

✅ **Unifies all data sources** (tasks, inbox, portfolio, pipeline, calendar, reading, nonnegotiables)
✅ **Scores across 4 dimensions** (urgency, importance, recency, commitment)
✅ **Provides explainability** (reasoning field, signal breakdown)
✅ **Adapts over time** (learns from user behavior)
✅ **Focuses on 5–10 actionable items** (rules-based filtering)
✅ **Respects time dynamics** (priority changes throughout the day)
✅ **Extensible for future sources** (easy to add new entity types)

**Next Steps:** Implement Phase 1 artifacts (types, stubs, comments) without changing runtime behavior.
