# Current Priority System - State Analysis

**Document Version:** 1.0
**Last Updated:** 2025-12-08
**Status:** Discovery Complete

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Priority Implementation](#current-priority-implementation)
3. [Data Source Inventory](#data-source-inventory)
4. [Current Priority Logic Analysis](#current-priority-logic-analysis)
5. [Strengths & Weaknesses](#strengths--weaknesses)

---

## Executive Summary

CASPER currently implements **two distinct priority/attention systems**:

1. **Task Priority System** - Simple low/medium/high priority levels assigned to individual tasks
2. **Company Attention System** - Multi-signal attention scoring for portfolio and pipeline companies

The **Priority Items** dashboard tile combines these systems by:
- Identifying overdue tasks linked to companies
- Identifying tasks due today linked to companies
- Identifying "stale" companies (no interaction in >14 days)

This creates a **task-centric and company-centric hybrid** that surfaces 4 priority items at a time, sorted by urgency type.

### Key Limitation

The current system **only surfaces priority items that are linked to companies** (portfolio or pipeline). This means:
- Standalone tasks without company links are invisible to the priority system
- Inbox items are not integrated into the priority list
- Calendar events don't influence priority
- Reading list items are not considered for priority
- Nonnegotiables/habits don't appear in priority items

---

## Current Priority Implementation

### Core Hook: `usePriorityItems`

**File:** `src/hooks/usePriorityItems.ts`

**Purpose:** Determines what appears in the "Priority Items" dashboard tile.

**Algorithm:**

```typescript
// Step 1: Fetch all incomplete tasks
const tasks = useTasks() // where completed = false

// Step 2: Filter to company-linked tasks only
const companyTasks = tasks.filter(t => t.company_id || t.pipeline_company_id)

// Step 3: Categorize tasks
for each task:
  if isPast(startOfDay(task.scheduled_for)) && !isToday(task.scheduled_for):
    category = "overdue" (priority: 0)
  else if isToday(task.scheduled_for):
    category = "due_today" (priority: 1)

// Step 4: Check for stale companies
for each portfolio company:
  daysSinceInteraction = differenceInDays(now, company.last_interaction_at)
  if daysSinceInteraction > 14 OR last_interaction_at is null:
    category = "stale" (priority: 2)

for each pipeline company:
  daysSinceInteraction = differenceInDays(now, company.last_interaction_at)
  if daysSinceInteraction > 14 OR last_interaction_at is null:
    category = "stale" (priority: 2)

// Step 5: Sort and limit
priorityItems
  .sort((a, b) => a.priorityType - b.priorityType) // overdue > due_today > stale
  .slice(0, 4) // Display only top 4 items
```

**Return Type:**

```typescript
interface PriorityItem {
  id: string;
  type: 'overdue' | 'due_today' | 'stale';
  companyId: string;
  companyName: string;
  companyLogo?: string | null;
  title: string;           // "Overdue task" | "Due today" | "Needs attention"
  description: string;     // Task content or interaction summary
  timestamp: string;       // ISO date string
  entityType: 'portfolio' | 'pipeline';
}
```

**Data Dependencies:**
- `useTasks()` - All incomplete tasks
- `useDashboardPortfolioCompanies()` - Portfolio companies with `last_interaction_at`
- `useDashboardPipelineFocus()` - Pipeline companies (only `is_top_of_mind = true`)

---

### Secondary System: `useCompanyAttention`

**File:** `src/hooks/useCompanyAttention.ts`

**Purpose:** Calculates attention status for all portfolio and top-of-mind pipeline companies shown in the "Companies" grid.

**Signals & Weights:**

| Signal | Condition | Weight |
|--------|-----------|--------|
| No interaction ever | `last_interaction_at` is null | 0.9 |
| No interaction >30 days | `differenceInDays(now, last_interaction_at) > 30` | 0.9 |
| No interaction 14-30 days | `differenceInDays(now, last_interaction_at)` between 14-30 | 0.5 |
| Open tasks + no next step | Company has open tasks AND `next_steps` is null | 0.8 |
| No next step defined | `next_steps` is null | 0.3 |

**Attention Score:** Sum of all applicable signal weights.

**Status Mapping:**

```typescript
if (score >= 1.2) status = "red"    // Needs immediate attention
else if (score >= 0.4) status = "yellow"  // On watch
else status = "green"  // Healthy
```

**Key Difference from Priority Items:**
- `useCompanyAttention` is purely **company-centric** (not task-centric)
- Displayed in the "Companies" grid, not the "Priority Items" tile
- Shows **all** portfolio companies and top-of-mind pipeline companies (not limited to 4)
- Includes visual status indicators (red/yellow/green glow)

---

## Data Source Inventory

### 1. Tasks

**Table:** `tasks`
**Hook:** `src/hooks/useTasks.ts`

**Priority-Relevant Fields:**

| Field | Type | Usage in Priority Logic |
|-------|------|-------------------------|
| `id` | string | Unique identifier |
| `content` | string | Task description (shown in priority item) |
| `completed` | boolean | Filter: only incomplete tasks (`false`) |
| `scheduled_for` | string \| null | Overdue/due today detection |
| `priority` | "low" \| "medium" \| "high" \| null | **Not currently used** in priority items logic |
| `status` | "todo" \| "inprogress" \| "done" \| null | **Not currently used** in priority items logic |
| `company_id` | string \| null | Link to portfolio company (required for priority visibility) |
| `pipeline_company_id` | string \| null | Link to pipeline company (required for priority visibility) |
| `project_id` | string \| null | **Not currently used** in priority logic |
| `is_quick_task` | boolean \| null | **Not currently used** in priority logic |
| `created_at` | string | **Not currently used** in priority logic |
| `updated_at` | string | **Not currently used** in priority logic |

**Current Query Pattern:**
```sql
SELECT tasks.*, projects.id, projects.name, projects.color,
       categories.id, categories.name
FROM tasks
LEFT JOIN projects ON tasks.project_id = projects.id
LEFT JOIN categories ON tasks.category_id = categories.id
WHERE tasks.created_by = $user_id
ORDER BY tasks.created_at DESC
```

**Underutilized Fields:**
- `priority` field exists but is ignored by priority items logic
- `status` field exists but not factored into urgency
- `created_at` / `updated_at` could indicate recency/staleness of task itself

---

### 2. Portfolio Companies

**Table:** `companies` (where `kind = 'portfolio'`)
**Hook:** `src/hooks/useDashboardPortfolioCompanies.ts`

**Priority-Relevant Fields:**

| Field | Type | Usage in Priority Logic |
|-------|------|-------------------------|
| `id` | string | Company identifier |
| `name` | string | Company name (displayed) |
| `logo_url` | string \| null | Company logo (displayed) |
| `last_interaction_at` | string \| null | **KEY**: Stale detection (>14 days) |
| `status` | enum | **Not currently used** in priority logic |
| `website_url` | string \| null | **Not currently used** |

**Related Data:**
- `open_task_count` - Computed by counting incomplete tasks where `company_id = company.id`
- `next_task` - Content of earliest scheduled task for this company

**Current Query Pattern:**
```sql
-- Companies
SELECT id, name, logo_url, website_url, status, last_interaction_at
FROM companies
WHERE kind = 'portfolio' AND created_by = $user_id
ORDER BY last_interaction_at DESC NULLS LAST
LIMIT 10

-- Open tasks per company
SELECT company_id, content, scheduled_for
FROM tasks
WHERE company_id IN ($companyIds) AND completed = false
ORDER BY scheduled_for ASC NULLS LAST
```

**Underutilized Fields:**
- `status` (active/watching/exited/archived) could deprioritize archived companies
- No tracking of company "importance" or strategic value

---

### 3. Pipeline Companies

**Table:** `pipeline_companies`
**Hook:** `src/hooks/useDashboardPipelineFocus.ts`

**Priority-Relevant Fields:**

| Field | Type | Usage in Priority Logic |
|-------|------|-------------------------|
| `id` | string | Company identifier |
| `company_name` | string | Company name |
| `logo_url` | string \| null | Company logo |
| `is_top_of_mind` | boolean | **KEY**: Only top-of-mind companies included |
| `last_interaction_at` | string \| null | **KEY**: Stale detection (>14 days) |
| `close_date` | string \| null | **Not currently used** in priority logic |
| `status` | string | **Not currently used** in priority logic |
| `next_steps` | string \| null | Used in attention scoring only |
| `current_round` | enum | **Not currently used** |

**Current Query Pattern:**
```sql
SELECT *
FROM pipeline_companies
WHERE is_top_of_mind = true AND created_by = $user_id
ORDER BY updated_at DESC
LIMIT 10
```

**Underutilized Fields:**
- `close_date` could create urgency for decision deadlines
- `status` (new/active/passed) could filter out inactive deals
- `current_round` could indicate strategic importance

---

### 4. Inbox Items

**Table:** `inbox_items`
**Hook:** `src/hooks/useInboxItems.ts`

**Priority-Relevant Fields:**

| Field | Type | Potential Priority Use |
|-------|------|------------------------|
| `id` | string | Identifier |
| `subject` | string | Email subject |
| `from_email` | string | Sender |
| `received_at` | string | **Recency** indicator |
| `is_read` | boolean | **Unread = new** |
| `is_resolved` | boolean | **Unresolved = actionable** |
| `snoozed_until` | string \| null | **Snoozed items** should be hidden until time |
| `related_company_id` | string \| null | Links to company for context |

**Current Status:** **NOT INTEGRATED** into priority items at all.

**Current Query Pattern:**
```sql
SELECT *
FROM inbox_items
WHERE created_by = $user_id
  AND is_resolved = false
  AND is_deleted = false
  AND (snoozed_until IS NULL OR snoozed_until <= NOW())
ORDER BY received_at DESC
```

**Opportunity:** Inbox items are a major source of "what needs attention" but are completely invisible to the priority system.

---

### 5. Calendar Events

**Table:** `calendar_events`
**Hook:** `src/hooks/useOutlookCalendar.ts`

**Priority-Relevant Fields:**

| Field | Type | Potential Priority Use |
|-------|------|------------------------|
| `id` | string | Event ID |
| `title` | string | Event title |
| `start_time` | string | **Event timing** (upcoming urgency) |
| `end_time` | string \| null | Duration |
| `attendees` | JSON \| null | Meeting participants |
| `is_all_day` | boolean \| null | All-day vs timed |

**Current Status:** **NOT INTEGRATED** into priority items at all.

**Opportunity:**
- Events starting soon (e.g., next 24 hours) could trigger prep tasks or reminders
- Meetings with specific companies could link to portfolio/pipeline entities
- Pre-event prep is a common "what do I need to do now" use case

---

### 6. Reading List

**Table:** `reading_items`
**Hook:** `src/hooks/useReadingItems.ts`

**Priority-Relevant Fields:**

| Field | Type | Potential Priority Use |
|-------|------|------------------------|
| `id` | string | Item ID |
| `title` | string | Article title |
| `url` | string | Link |
| `is_read` | boolean \| null | **Unread items** need attention |
| `created_at` | string | **Recency** of bookmarking |
| `project_id` | string \| null | Project context |

**Current Status:** **NOT INTEGRATED** into priority items at all.

**Opportunity:**
- Recent, unread items with project context could be prioritized
- "Research for Monday IC" type reading could be deadline-driven
- Reading related to portfolio companies could be contextualized

---

### 7. Nonnegotiables (Habits)

**Table:** `nonnegotiables`
**Hook:** `src/hooks/useNonnegotiables.ts`

**Priority-Relevant Fields:**

| Field | Type | Potential Priority Use |
|-------|------|------------------------|
| `id` | string | Habit ID |
| `title` | string | Habit title |
| `frequency` | string \| null | Recurrence pattern |
| `reminder_time` | string \| null | Time of day |
| `is_active` | boolean \| null | Active status |

**Current Status:** **NOT INTEGRATED** into priority items at all.

**Opportunity:**
- Daily/recurring habits could appear as "today's nonnegotiables" in priority
- High commitment score for explicit commitments

---

### 8. Company Interactions

**Tables:** `company_interactions`, `pipeline_interactions`
**Hooks:** `src/hooks/useCompanyInteractions.ts`, `src/hooks/usePipelineInteractions.ts`

**Priority-Relevant Fields:**

| Field | Type | Usage |
|-------|------|-------|
| `occurred_at` | string | Determines `last_interaction_at` (most recent) |
| `interaction_type` | enum | Call, meeting, email, note, update |
| `content` | string | Interaction details |

**Current Usage:** Interactions update the `last_interaction_at` field on companies, which drives stale detection.

---

## Current Priority Logic Analysis

### How Priority Items Are Determined Today

**Step-by-Step Process:**

1. **Fetch incomplete tasks** (`completed = false`)
2. **Filter to company-linked tasks only** (`company_id` OR `pipeline_company_id` exists)
3. **Categorize tasks:**
   - **Overdue:** `scheduled_for` is in the past (not today) → Priority 0
   - **Due today:** `scheduled_for` is today → Priority 1
4. **Check company staleness:**
   - For each portfolio company: If `last_interaction_at` is >14 days ago or null → "Stale" (Priority 2)
   - For each pipeline company (top-of-mind only): If `last_interaction_at` is >14 days ago or null → "Stale" (Priority 2)
5. **Sort by priority type** (0 > 1 > 2)
6. **Limit to top 4 items**

**Key Heuristics:**

| Heuristic | Value | Rationale |
|-----------|-------|-----------|
| Overdue tasks are highest priority | Priority 0 | Past deadlines = immediate action |
| Due today tasks are second priority | Priority 1 | Today's deadlines = important |
| Stale companies are third priority | Priority 2 | Relationship maintenance |
| Stale threshold | 14 days | Two weeks without contact |
| Display limit | 4 items | Keep list focused and actionable |

---

## Strengths & Weaknesses

### ✅ Strengths

1. **Simple and Predictable**
   - Clear rules: overdue > due today > stale
   - Easy to understand and explain to users

2. **Company-Centric Design**
   - Aligns with VC/investment workflow (companies are the primary unit)
   - Links tasks to portfolio/pipeline context

3. **Stale Detection**
   - Proactively surfaces companies that haven't been touched in 14+ days
   - Prevents relationships from going cold

4. **Focused List**
   - Limiting to 4 items prevents overwhelm
   - Forces prioritization

5. **Dual System Separation**
   - Priority Items (4 items) for immediate actions
   - Company Attention Grid for broader health overview

---

### ❌ Weaknesses & Failure Modes

#### 1. **Noise: Over-representation of Stale Companies**

**Problem:** If many companies haven't been touched in 14 days, the priority list can be dominated by "stale" items, pushing out more urgent tasks.

**Example:**
- User has 8 overdue tasks (not linked to companies)
- User has 3 companies with no interaction in 15 days
- Priority list shows: 3 stale companies + 1 overdue company task
- Result: 7 unlinked overdue tasks are completely invisible

**Root Cause:**
- All stale companies have the same priority level (2)
- No differentiation between "15 days stale" vs "60 days stale"
- No consideration of company importance or status

---

#### 2. **Blind Spots: Standalone Tasks Invisible**

**Problem:** Tasks not linked to companies are **completely excluded** from the priority system.

**Example:**
- User has personal tasks like "Review Q4 financials" (overdue)
- User has project tasks like "Finish deck for LP meeting" (due tomorrow)
- These never appear in priority items because they lack `company_id` or `pipeline_company_id`

**Root Cause:**
- Priority logic filters: `tasks.filter(t => t.company_id || t.pipeline_company_id)`
- This is a **fundamental design constraint** that excludes non-company work

**Impact:** High. Personal productivity tasks, project work, and internal operations are deprioritized.

---

#### 3. **Blind Spots: Inbox Not Integrated**

**Problem:** Inbox items (emails forwarded to CASPER) don't appear in priority items at all.

**Example:**
- User receives urgent email from LP: "Can you send me the Q3 report by EOD?"
- Email sits unresolved in inbox
- Never surfaces in priority items

**Root Cause:** Priority system only looks at tasks and companies, not inbox.

**Impact:** Medium-High. Users must check inbox separately, defeating the "command center" concept.

---

#### 4. **Blind Spots: Calendar Events Not Considered**

**Problem:** Upcoming calendar events don't influence priority.

**Example:**
- User has IC meeting at 2 PM today
- User hasn't prepared materials for the meeting
- No prep task is automatically surfaced or linked to the event

**Root Cause:** Calendar is a separate module with no priority integration.

**Impact:** Medium. Users must remember to check calendar alongside priorities.

---

#### 5. **Blind Spots: Reading List Not Prioritized**

**Problem:** Reading items saved with context (e.g., "Read for IC meeting") don't appear in priorities.

**Example:**
- User bookmarks article: "Competitive analysis for Cashmere"
- Article is unread and tagged for a project
- Never surfaces in priority items

**Root Cause:** Reading list is purely a reference collection, not integrated into priority logic.

**Impact:** Low-Medium. Reading is less urgent but can be prep work for meetings/decisions.

---

#### 6. **Staleness: No Recency or Decay**

**Problem:** Priority items don't consider how recently something became relevant or was last addressed.

**Example:**
- Task "Follow up with Acme" was created 6 months ago, overdue by 5 months
- Task "Follow up with Beta" was created yesterday, overdue by 1 day
- Both appear equally in priority (both are "overdue")

**Root Cause:** No `last_activity_at`, `last_viewed_at`, or recency tracking on tasks.

**Impact:** Old stale tasks linger indefinitely at top of priority list.

---

#### 7. **Fragmentation: Multiple Signals Not Unified**

**Problem:** Priority Items and Company Attention Grid are separate systems with different logic.

**Example:**
- Company has "red" attention status (score 1.5)
- Company has 1 overdue task
- Priority Items shows the overdue task
- Company Attention Grid shows red status
- User sees both but must mentally integrate the signals

**Root Cause:** Two parallel systems instead of one unified priority model.

**Impact:** Medium. Cognitive load to reconcile two views of "what needs attention."

---

#### 8. **No Importance Weighting**

**Problem:** All overdue tasks are equally urgent, regardless of strategic importance.

**Example:**
- Task 1: "Call portfolio company CEO about bridge round" (high stakes)
- Task 2: "Update company logo in CRM" (low stakes)
- Both are overdue → both equally prioritized

**Root Cause:** Task `priority` field exists (low/medium/high) but is **not used** in priority items logic.

**Impact:** High. Critical work can be drowned out by administrative tasks.

---

#### 9. **No Effort Consideration**

**Problem:** Priority doesn't distinguish between quick wins and heavy lifts.

**Example:**
- Task 1: "Send email to confirm meeting" (2 minutes)
- Task 2: "Complete 50-page diligence memo" (8 hours)
- Both due today → both equally prioritized

**Root Cause:** No effort/time estimation on tasks.

**Impact:** Medium. Users might delay quick wins to focus on large tasks (or vice versa).

---

#### 10. **Hard-Coded Thresholds**

**Problem:** Stale threshold (14 days) and display limit (4 items) are hard-coded.

**Example:**
- In a busy period, user touches companies every 7 days → no stale companies shown (good)
- In a slow period, user touches companies every 20 days → many stale companies shown (noisy)
- User can't adjust sensitivity

**Root Cause:** Fixed constants in code:
```typescript
const daysSinceInteraction = differenceInDays(now, lastInteraction);
if (daysSinceInteraction > 14) { ... }
```

**Impact:** Low-Medium. System can't adapt to different user workflows or cadences.

---

#### 11. **No Commitment Score**

**Problem:** Explicit commitments (calendar events, nonnegotiables) don't influence priority.

**Example:**
- User commits to daily nonnegotiable: "Exercise 30 min"
- User has no overdue tasks today
- Nonnegotiable never appears in priority items

**Root Cause:** Nonnegotiables and calendar are not integrated into priority logic.

**Impact:** Medium. Commitments to self (habits) are as important as commitments to others (tasks).

---

#### 12. **No Explainability**

**Problem:** Priority items don't explain *why* they're prioritized.

**Example:**
- User sees "Company X: Needs attention"
- User doesn't know if it's due to: no interaction, overdue task, missing next step, or combination

**Root Cause:** No `reasoning` or `explanation` field in priority item data structure.

**Impact:** Medium. Users must click through to understand context.

---

### Summary Table: Current System Gaps

| Gap | Severity | Data Source Missing |
|-----|----------|---------------------|
| Standalone tasks invisible | 🔴 High | Tasks (non-company) |
| Inbox not integrated | 🔴 High | Inbox items |
| No importance weighting | 🔴 High | Task `priority` field ignored |
| Calendar not integrated | 🟡 Medium | Calendar events |
| No recency/decay | 🟡 Medium | Task activity timestamps |
| Stale company noise | 🟡 Medium | Company importance/status not factored |
| No explainability | 🟡 Medium | Reasoning field missing |
| Reading list not prioritized | 🟢 Low | Reading items |
| Nonnegotiables not integrated | 🟢 Low | Nonnegotiables |
| No effort consideration | 🟢 Low | Task time estimates |

---

## Files & Code References

### Priority System Files

| File | Purpose | Lines |
|------|---------|-------|
| `src/hooks/usePriorityItems.ts` | Core priority logic | 150 |
| `src/hooks/useCompanyAttention.ts` | Company attention scoring | 120 |
| `src/components/dashboard/DashboardPrioritySection.tsx` | Priority tile UI | 300 |
| `src/components/dashboard/CompaniesCommandPane.tsx` | Company grid UI | 200 |

### Data Source Hooks

| File | Data Source | Fields Used |
|------|-------------|-------------|
| `src/hooks/useTasks.ts` | Tasks | `completed`, `scheduled_for`, `company_id`, `pipeline_company_id` |
| `src/hooks/useDashboardPortfolioCompanies.ts` | Portfolio companies | `last_interaction_at`, `name`, `logo_url` |
| `src/hooks/useDashboardPipelineFocus.ts` | Pipeline companies | `last_interaction_at`, `is_top_of_mind` |
| `src/hooks/useInboxItems.ts` | Inbox items | ❌ Not used in priority |
| `src/hooks/useOutlookCalendar.ts` | Calendar events | ❌ Not used in priority |
| `src/hooks/useReadingItems.ts` | Reading items | ❌ Not used in priority |
| `src/hooks/useNonnegotiables.ts` | Nonnegotiables | ❌ Not used in priority |

---

## Next Steps

See `02_proposed_model.md` for:
- Unified priority model design
- Multi-dimensional scoring (urgency, importance, recency, commitment)
- Source-to-PriorityItem mapping rules
- Scoring function and weights
- UX implications and interaction model
