# Tasks V2 — Audit, Gap Analysis & Implementation Plan

---

## 1. Current System Map

### Data Model

**Primary table: `tasks`** (23 columns)

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | Auto-generated |
| `content` | text | Task title (required) |
| `status` | text | "todo" / "inprogress" / "done" |
| `priority` | text | "low" / "medium" / "high" |
| `completed` | boolean (nullable) | Redundant with status="done" |
| `completed_at` | timestamptz | Set on completion |
| `created_by` | UUID FK → auth.users | Owner |
| `created_at` / `updated_at` | timestamptz | Timestamps |
| `project_id` | UUID FK → projects | Optional project link |
| `category_id` | UUID FK → categories | Optional category |
| `company_id` | UUID FK → companies | Portfolio company link |
| `pipeline_company_id` | UUID FK → pipeline_companies | Pipeline company link |
| `source_inbox_item_id` | UUID FK → inbox_items | Email origin |
| `scheduled_for` | timestamptz | Due date |
| `is_quick_task` | boolean | **"Triage" flag** |
| `is_top_priority` | boolean | Top-priority pin |
| `snoozed_until` | timestamptz | Snooze target |
| `snooze_count` | integer | Times snoozed |
| `last_snoozed_at` | timestamptz | Last snooze timestamp |
| `effort_minutes` | integer | Effort estimate |
| `effort_category` | text | "quick"/"medium"/"deep"/"unknown" |
| `archived_at` | timestamptz | When archived; null = active |

**Related tables:**
- `project_notes` + `note_links` — Polymorphic notes system. Notes stored in `project_notes`, linked to tasks via `note_links` where `target_type = 'task'`.
- `snooze_log` — Audit trail for snooze actions.
- `categories`, `projects` — Reference data.
- `work_items` + `entity_links` + `item_extracts` — Focus Queue system (separate from tasks).

**RLS:** `created_by = auth.uid()` pattern on all operations.

### Frontend Files

| File | Role |
|------|------|
| `src/hooks/useTasks.ts` | Core CRUD, transforms (`Task` interface, `transformTask`, `transformTaskForDatabase`, `createTask`, `updateTask`, `deleteTask`, `snoozeTask`, `markTaskTopPriority`, `getInboxTasks`, `getNonInboxTasks`, `getArchivedTasks`, `archiveTask`, `unarchiveTask`) |
| `src/hooks/useTasksManager.tsx` | Orchestrator: `handleAddTask` (sets `is_quick_task: true`), `handleCompleteTask`, `handlePromoteTask`, `handleUpdateTaskStatus`, `handleUpdateTask`, `quickInlineUpdate`, `bulkUpdate`, `handleArchiveTask`, `handleUnarchiveTask` |
| `src/hooks/useTaskDetails.ts` | Form state for edit panel (includes `companyLink` via `TaskCompanyLink`) |
| `src/hooks/useTaskFiltering.ts` | Filter/sort logic (excludes inbox by default) |
| `src/hooks/useCompanyTasks.ts` | Tasks scoped to `company_id` with real-time subscription |
| `src/hooks/usePipelineTasks.ts` | Tasks scoped to `pipeline_company_id` with real-time subscription |
| `src/hooks/usePipelineTasksAggregate.ts` | Multi-company task aggregation for pipeline views |
| `src/hooks/useProjectTasks.ts` | Tasks scoped to `project_id` |
| `src/hooks/useTaskAttachments.ts` | Email attachments via `source_inbox_item_id` |
| `src/hooks/useNotes.ts` | Polymorphic notes: `useNotesForTarget`, `createNote`, `updateNote`, `deleteNote` |
| `src/pages/Tasks.tsx` | **Main page**: 2-column grid (summary panel + content), quick-add, view toggle, filters, triage section, main content, task details slide-over |
| `src/components/tasks/QuickTaskInput.tsx` | Quick-add input (content only) |
| `src/components/tasks/TasksSummaryPanel.tsx` | **Left sidebar**: search, status/priority stat chips, filter dropdowns, view toggle, triage/archive toggles |
| `src/components/tasks/TasksFilters.tsx` | Filter bar (mobile fallback) |
| `src/components/tasks/TasksMainContent.tsx` | List view container |
| `src/components/tasks/TasksKanbanView.tsx` | Kanban with drag-drop (react-beautiful-dnd) |
| `src/components/tasks/InboxSection.tsx` | Triage UI with keyboard shortcuts, bulk actions, promote button |
| `src/components/tasks/kanban/InboxColumn.tsx` | Kanban triage column |
| `src/components/modals/AddTaskDialog.tsx` | "New Task" modal |
| `src/components/modals/TaskDetailsDialog.tsx` | **Sheet-based slide-over panel** with properties, links, notes, attachments, activity sections; footer with delete/archive/save |
| `src/components/modals/task-details/TaskDetailsForm.tsx` | Form fields container |
| `src/components/modals/task-details/TaskContentInput.tsx` | Title input |
| `src/components/modals/task-details/CompanySelector.tsx` | **Unified company selector** (portfolio + pipeline) |
| `src/components/modals/task-details/ProjectSelector.tsx` | Project dropdown |
| `src/components/modals/task-details/CategorySelector.tsx` | Category dropdown |
| `src/components/modals/task-details/DateSelector.tsx` | Due date picker |
| `src/components/modals/task-details/PrioritySelector.tsx` | Priority toggle group |
| `src/components/modals/task-details/StatusSelector.tsx` | Status toggle group |
| `src/components/modals/task-details/TaskLinksSection.tsx` | Source email link, company links |
| `src/components/modals/task-details/TaskActivitySection.tsx` | Created/updated timestamps |
| `src/components/notes/TaskNotesSection.tsx` | Notes list + editor for task detail panel |
| `src/components/tasks/TaskAttachmentsSection.tsx` | Email attachments display with inline preview |
| `src/components/dashboard/TaskList.tsx` | Shared task row renderer |
| `src/components/task-cards/TaskCardContent.tsx` | Card text display |
| `src/components/task-cards/TaskCardMetadata.tsx` | Metadata chips (priority, project, date) |
| `src/components/command-pane/CompanyCommandTasks.tsx` | Tasks tab inside company detail pane |
| `src/components/command-pane/CompanyCommandTimeline.tsx` | Timeline merging interactions + task events |
| `src/components/dashboard/InboxDetailDrawer.tsx` | Email detail drawer with "Create Task" button |

### Data Flow

```
QuickTaskInput → handleAddTask(content) → createTask({ content, is_quick_task: true })
                                                    ↓
                                              Supabase INSERT → tasks table
                                                    ↓
                                              setTasks() → local state update
                                                    ↓
                                              getInboxTasks() filter → InboxSection UI

InboxSection triage → quickInlineUpdate / bulkUpdate / handlePromoteTask → Supabase UPDATE
                                                    ↓
                                              (DB trigger clears is_quick_task when status ≠ 'todo')
                                                    ↓
                                              Task appears in main list (getNonInboxTasks)

Completed tasks → 14-day auto-archive (client-side isTaskArchived check)
                → or manual archive (archived_at set)
                → getArchivedTasks() filter → shown when "Show Archived" toggled
```

---

## 2. Gap Analysis

### ~~Gap 1: Quick-Add Notes Are Not Persisted~~ → PARTIALLY ADDRESSED

**Status:** The `description` column was **not added** to the tasks table. However, the threaded notes system (`TaskNotesSection`) is now integrated into the task detail slide-over panel. Users can add longer notes via that section.

**Remaining gap:** No inline description field on the task itself — only separate threaded notes.

**Recommendation:** Consider adding a `description` text column for a simple one-liner description distinct from threaded notes. Low priority since notes system serves the purpose.

### ~~Gap 2: Inbox Is a Boolean Flag, Not a Status~~ → DEFERRED (Option A applied)

**Status:** The `is_quick_task` boolean remains. The UI now labels it **"Triage"** instead of "Inbox". An explicit **Promote** button (`handlePromoteTask`) was added so users can manually move tasks out of triage without needing to set date/project/status.

**Remaining gap:** `is_quick_task` field name is still confusing in the schema. No migration to status-based inbox yet.

### ~~Gap 3: AddTaskDialog Lacks Company Linking UI~~ → COMPLETED

**Status:** `CompanySelector.tsx` was built as a unified search component supporting both portfolio and pipeline companies. It is integrated into `TaskDetailsDialog` via `TaskDetailsForm`.

**Note:** The `AddTaskDialog` modal still relies on prefill for company info. The full `CompanySelector` is available in the detail panel.

### ~~Gap 4: TaskDetailsDialog Has No Company Linking~~ → COMPLETED

**Status:** `CompanySelector` is now a field in `TaskDetailsForm`. The `useTaskDetails` hook manages `companyLink` state via `TaskCompanyLink` type. `handleUpdateTask` in `useTasksManager` passes through `company_id` / `pipeline_company_id`.

### ~~Gap 5: No Aging/Archive for Completed Tasks~~ → COMPLETED

**Status:** Fully implemented:
- Migration `20260129300000_pr3_archive_column.sql` added `archived_at` column with indexes
- Backfill ran for tasks completed >30 days ago
- Client-side `isTaskArchived()` auto-archives tasks completed >14 days
- `archiveTask()` / `unarchiveTask()` for manual archive
- "Show Archived" toggle in `TasksSummaryPanel`
- Archive/Unarchive buttons in `TaskDetailsDialog` footer

### Gap 6: Tasks Not Visible in Email Detail Pane → OPEN

**Where it manifests:** `InboxDetailDrawer.tsx` has a "Create Task" button but does not show existing tasks linked to that email.

**Root cause:** No query fetches tasks by `source_inbox_item_id` in the email detail view.

**Fix:** In `InboxDetailDrawer`, query `tasks` where `source_inbox_item_id = currentEmail.id` and render them in a small section. Reuse `TaskCardContent` + `TaskCardMetadata` components.

### Gap 7: No "Create Follow-Up Task" from Calendar Events → OPEN

**Where it manifests:** Calendar event detail modal shows event info but has no task creation action.

**Root cause:** Feature not built. No link from calendar events to tasks exists in the schema.

**Fix:** Add a "Create Follow-Up Task" button to `EventDetailsModal`. Pre-fill task content with event title, due date with event date + 1 day, and company if the event matches a company via domain. No schema change needed.

### ~~Gap 8: `completed` Boolean Is Redundant with `status = 'done'`~~ → DEFERRED

**Status:** Both fields remain synced. `handleCompleteTask` toggles both. No migration planned — low risk.

### ~~Gap 9: Tasks Page Layout Wastes Space~~ → COMPLETED

**Status:** The tasks page now uses a **2-column workspace layout**:
- Left: `TasksSummaryPanel` (desktop-only, sticky) with search, stat chips, filters, view/toggle controls
- Right: Quick-add + main content area (list or kanban)
- Mobile: Collapsible filter panel, single-column layout

The original stacked header/view-toggle/filter/inbox/content layout was replaced.

### Gap 10: No Importance Ranking Separate from Priority → DEFERRED

**Status:** `is_top_priority` boolean exists. No `importance_rank` column added. Low priority — the top-priority pin serves the basic need.

### Gap 11: Filters Don't Support Company Type → OPEN

**Where it manifests:** `TasksSummaryPanel` has category, project, sort — no company filter.

**Fix:** Add "Company" filter dropdown that searches across portfolio + pipeline companies.

---

## 3. Tasks V2 Data Model

### Schema Changes Applied

**`archived_at` column** (migration `20260129300000_pr3_archive_column.sql`):
```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_tasks_archived ON tasks (created_by, archived_at) WHERE archived_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_completed_aging ON tasks (created_by, completed_at) WHERE completed_at IS NOT NULL;
-- Backfill: archive tasks completed more than 30 days ago
UPDATE tasks SET archived_at = completed_at
WHERE completed = true AND completed_at < now() - interval '30 days' AND archived_at IS NULL;
```

**Focus Queue tables** (migration `20260130100000_focus_queue_tables.sql`):
- `work_items` — Unified review queue entries
- `entity_links` — Polymorphic links from work items to companies/projects
- `item_extracts` — AI-generated summaries and suggestions

### Remaining Schema Changes (Not Yet Applied)

```sql
-- Task description (inline short notes, distinct from threaded notes)
ALTER TABLE tasks ADD COLUMN description text;

-- Importance rank (1=highest, null=unranked)
ALTER TABLE tasks ADD COLUMN importance_rank smallint CHECK (importance_rank BETWEEN 1 AND 5);
```

These are optional and deferred.

### Relationship Diagram

```
tasks
  ├─── company_id ────────────→ companies (portfolio)
  ├─── pipeline_company_id ───→ pipeline_companies
  ├─── project_id ────────────→ projects
  ├─── category_id ───────────→ categories
  ├─── source_inbox_item_id ──→ inbox_items (email origin)
  ├─── created_by ────────────→ auth.users
  │
  └─── (via note_links.target_id where target_type='task')
      └── note_links ──→ project_notes (threaded notes/comments)

work_items (Focus Queue — separate system)
  ├─── source_type + source_id → polymorphic (email, calendar_event, task, note, reading)
  ├─── created_by → auth.users
  │
  ├─── entity_links → companies / projects (with confidence score)
  └─── item_extracts → AI summaries, suggested tasks, highlights
```

### RLS Policy (Unchanged Pattern)

```sql
CREATE POLICY "Users can manage their own tasks"
  ON tasks FOR ALL
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
```

---

## 4. UX Implementation Status

### Tasks Page — Workspace Layout ✅ COMPLETED

```
┌─────────────────────────────────────────────────────────────────┐
│ [Mobile: Filters toggle button]                                 │
├──────────────────────────┬──────────────────────────────────────┤
│ TASKS COMMAND            │ [+ Quick Add ________________________]│
│                          │                                      │
│ [🔍 Search tasks...]    │  ▸ Triage (3)       [promote]        │
│                          │    ☐ Review deck from Acme Corp      │
│ BY STATUS                │    ☐ Follow up on intro email        │
│ [● All Items     12]    │    ☐ Check pipeline data             │
│ [○ To Do          5]    │                                      │
│ [⟳ In Progress    3]    │  TASKS                               │
│ [✓ Done           4]    │  ────────────────────────────────     │
│ [📦 Archived      8]    │  ☐ Prepare board memo  P1 ProjectX 📅│
│                          │  ☐ Send term sheet     P2 DealY   📅│
│ BY PRIORITY              │  ☐ Update model        P3 Ops       │
│ [↑ High    2]           │  ☑ Draft LP letter (done)            │
│ [→ Medium  4]           │                                      │
│ [↓ Low     3]           │                                      │
│                          │                                      │
│ FILTERS                  │                                      │
│ Category: [All ▾]       │                                      │
│ Project:  [All ▾]       │                                      │
│ Sort by:  [Date ▾]      │                                      │
│                          │                                      │
│ VIEW                     │                                      │
│ [List] [Kanban]          │                                      │
│ Show Triage   [toggle] 3│                                      │
│ Show Archived [toggle] 8│                                      │
└──────────────────────────┴──────────────────────────────────────┘
```

### Task Detail Slide-Over Panel ✅ COMPLETED

Replaced centered `GlassModal` with right slide-over `Sheet`:

```
┌──────────────────────────────────┐
│ ✏ Task Detail          [Float]  │
├──────────────────────────────────┤
│                                  │
│ ─── PROPERTIES ─────────────     │
│ Content:  [Prepare board memo__] │
│ Status:    [● In Progress ▾]     │
│ Priority:  [High ▾]             │
│ Due Date:  [Jan 30, 2026 ▾]     │
│ Project:   [Board Meetings ▾]    │
│ Category:  [Ops ▾]              │
│ Company:   [Acme Corp ▾]  🏢    │
│                                  │
│ ─── LINKS ──────────────────     │
│ 📧 Source email: "Re: Board..." │
│ 🏢 Company: Acme Corp           │
│                                  │
│ ─── NOTES (2) ──────────────     │
│ Jan 28 — Updated with Q4 data   │
│ Jan 25 — Initial draft started   │
│ [+ Add note]                     │
│                                  │
│ ─── ATTACHMENTS (1) ────────     │
│ 📎 board_deck_v3.pdf  2.1MB     │
│                                  │
│ ─── ACTIVITY ───────────────     │
│ Created: Jan 25, 2026            │
│ Updated: Jan 28, 2026            │
│                                  │
├──────────────────────────────────┤
│ [🗑 Delete][📦 Archive] [Cancel][Save]│
└──────────────────────────────────┘
```

**Implemented sections:**
1. **Properties** — Content, status, priority, date, project, category, company (via `CompanySelector`)
2. **Links** — Source email link, company link display (`TaskLinksSection`)
3. **Notes** — Threaded notes via `TaskNotesSection`
4. **Attachments** — Email attachments via `TaskAttachmentsSection`
5. **Activity** — Created/updated timestamps (`TaskActivitySection`)
6. **Float button** — Opens floating note editor linked to the task

---

## 5. Global Integration Points

### 5A. Company Detail Pane — Tasks Tab ✅ WORKING

**File:** `src/components/command-pane/CompanyCommandTasks.tsx`

Uses `useCompanyTasks` / `usePipelineTasks`. Tasks linked via `company_id` / `pipeline_company_id` appear here. Real-time Supabase subscriptions keep it in sync.

### 5B. Email Detail Pane — Show Linked Tasks ❌ NOT DONE

**File to modify:** `src/components/dashboard/InboxDetailDrawer.tsx`

**Current state:** Has "Create Task" button. Does NOT show existing tasks linked to this email.

**Change:** After the "Create Task" button, add a section querying tasks by `source_inbox_item_id`. Reuse `TaskCardContent` + `TaskCardMetadata` components.

### 5C. Calendar Event Detail — "Create Follow-Up Task" ❌ NOT DONE

**File to modify:** `src/components/modals/EventDetailsModal.tsx` (or equivalent)

**Change:** Add a "Create Follow-Up Task" button that opens `AddTaskDialog` with prefill:
```tsx
const prefill: TaskPrefillOptions = {
  content: `Follow up: ${event.title}`,
  dueDate: addDays(new Date(event.end_time), 1),
  companyId: matchedCompany?.id,
  companyType: matchedCompany?.type,
  companyName: matchedCompany?.name,
};
```

### 5D. Company Timeline — Task Events ✅ WORKING

**File:** `src/hooks/useCompanyTimeline.ts` merges task_created/task_completed into the timeline.

### 5E. Focus Queue — Task Creation ✅ WORKING

**File:** `src/components/focus/WorkItemReviewCard.tsx`

Task suggestions can be created from focus queue work items via `useWorkItemActions.createTaskFromSuggestion`. Content and priority are editable before creation via `TaskSuggestionEditor`.

---

## 6. Aging Logic ✅ IMPLEMENTED

### Default Behavior

1. **Completed tasks older than 14 days** are considered archived (client-side `isTaskArchived()`)
2. Tasks with `archived_at IS NOT NULL` are also archived (manual or backfill)
3. Archived tasks are hidden from `getNonInboxTasks()` and shown via `getArchivedTasks()`
4. **"Show Archived"** toggle in `TasksSummaryPanel` reveals them

### Archive Detection Logic

```typescript
const isTaskArchived = (task: Task): boolean => {
  if (task.archived_at) return true;           // Explicitly archived
  if (task.completed && task.completed_at) {
    const completedDate = new Date(task.completed_at);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    return completedDate < fourteenDaysAgo;     // Auto-archived after 14 days
  }
  return false;
};
```

### UI Controls

In `TasksSummaryPanel`:
- **"Show Archived"** toggle switch with count badge
- **Archive/Unarchive** buttons in `TaskDetailsDialog` footer

### Database Backfill (Applied)

```sql
UPDATE tasks SET archived_at = completed_at
WHERE completed = true AND completed_at < now() - interval '30 days' AND archived_at IS NULL;
```

### Auto-Archive Cron (Not Implemented)

A Supabase Edge Function or pg_cron job for periodic auto-archive is **not implemented**. The client-side `isTaskArchived()` check handles this transparently.

---

## 7. Implementation Plan — Status Tracker

### PR1: Fix Quick-Add Note Persistence + Add Description Column — SKIPPED

**Decision:** The threaded notes system (`TaskNotesSection`) serves the purpose. No `description` column was added. This can be revisited if user feedback indicates a need.

---

### PR2: Add Company Selector to Task Modals — ✅ COMPLETED

**What was done:**
- Created `src/components/modals/task-details/CompanySelector.tsx` — unified search across portfolio + pipeline companies
- Created `src/lib/taskCompanyLink.ts` — utility for `TaskCompanyLink` type (get/set)
- Updated `src/hooks/useTaskDetails.ts` — added `companyLink` state via `TaskCompanyLink`
- Updated `src/components/modals/task-details/TaskDetailsForm.tsx` — added `CompanySelector`
- Updated `src/hooks/useTasksManager.tsx` — `handleUpdateTask` passes `company_id` / `pipeline_company_id`

---

### PR3: Aging Logic + Archive Column — ✅ COMPLETED

**What was done:**
- Migration `20260129300000_pr3_archive_column.sql` — `archived_at` column + indexes + backfill
- Updated `src/hooks/useTasks.ts` — `isTaskArchived()`, `getArchivedTasks()`, `archiveTask()`, `unarchiveTask()`
- Updated `src/hooks/useTasksManager.tsx` — `handleArchiveTask`, `handleUnarchiveTask`, `archivedTasks`
- Updated `src/pages/Tasks.tsx` — `showArchived` state, archive callbacks
- Updated `src/components/modals/TaskDetailsDialog.tsx` — Archive/Unarchive buttons in footer

---

### PR4: Tasks Page Workspace Layout — ✅ COMPLETED

**What was done:**
- Created `src/components/tasks/TasksSummaryPanel.tsx` — sticky left sidebar with search, stat chips, filters, view controls
- Refactored `src/pages/Tasks.tsx` — 2-column grid layout, search filtering, mobile responsive
- Triage section renamed from "Inbox" in UI
- Triage section is toggle-able via `showTriage` switch
- Search input filters tasks by content text

---

### PR5: Task Detail Slide-Over + Activity — ✅ COMPLETED

**What was done:**
- Converted `TaskDetailsDialog` from `GlassModal` to `Sheet` (right slide-over panel)
- Added `TaskLinksSection.tsx` — source email link, company link display
- Added `TaskActivitySection.tsx` — created/updated timestamps
- Added `Float` button for floating note editor
- Structured into sections: Properties, Links, Notes, Attachments, Activity
- Footer: Delete, Archive/Unarchive, Cancel, Save Changes

---

### PR6: Email + Calendar Task Integration — ❌ NOT STARTED

**Goal:** Show linked tasks in email detail pane; add "Create Follow-Up" to calendar events.

**Files to modify:**
- `src/components/dashboard/InboxDetailDrawer.tsx` — add "Linked Tasks" section below "Create Task" button
- `src/hooks/useEmailTasks.ts` — **new**: `useEmailTasks(inboxItemId)` hook
- Calendar event detail modal — add "Create Follow-Up Task" button

**Manual test checklist:**
- [ ] Open email detail that has linked tasks → see task list
- [ ] Toggle complete on linked task from email detail → verify status updates
- [ ] Open calendar event → click "Create Follow-Up Task" → verify dialog opens with correct prefill
- [ ] Save follow-up task → verify it appears in main tasks list with correct due date

---

### PR7: Focus Queue Integration — ✅ COMPLETED

**What was done (beyond original plan):**
- Migration `20260130100000_focus_queue_tables.sql` — `work_items`, `entity_links`, `item_extracts` tables
- Created `src/pages/FocusQueue.tsx` — 3-column layout: Filters | Queue + Review | Context Rail
- Created `src/hooks/useWorkQueue.ts` — fetch and filter work items
- Created `src/hooks/useWorkItemDetail.ts` — detailed work item info
- Created `src/hooks/useWorkItemActions.ts` — link, create task, save note, snooze, ignore, trust
- Created `src/hooks/useBackfillWorkItems.ts` — backfill from existing records
- Created `src/hooks/useEnsureWorkItem.ts` — ensure work item exists
- Created `src/components/focus/FocusFiltersPanel.tsx` — filter sidebar
- Created `src/components/focus/WorkQueueList.tsx` — work item list
- Created `src/components/focus/WorkItemReviewCard.tsx` — review card with actions
- Created `src/components/focus/WorkItemContextRail.tsx` — context rail
- Created `src/components/focus/TaskSuggestionEditor.tsx` — task suggestion editor

---

### PR8 (Future): Remaining Enhancements

**Deferred items:**
- `description` column for inline task description
- `importance_rank` column + Eisenhower matrix view
- Full activity log (track status changes, priority changes via `task_activity` table)
- Auto-archive cron job via Supabase Edge Function
- Company filter in task filters/summary panel
- Search in mobile (currently desktop-only)
- Linked tasks in email detail pane (PR6)
- Calendar event follow-up task creation (PR6)
- Rename `is_quick_task` → `is_triage` in schema (low priority)
- Persist filter state across navigation

---

## Summary

| PR | Scope | Status | Schema Change |
|----|-------|--------|---------------|
| PR1 | Description column | **Skipped** (notes system sufficient) | — |
| PR2 | Company selector in task modals | **✅ Completed** | None |
| PR3 | Aging/archive logic | **✅ Completed** | Add column + backfill |
| PR4 | Workspace layout + summary panel | **✅ Completed** | None |
| PR5 | Slide-over detail panel + activity | **✅ Completed** | None |
| PR6 | Email/calendar integration | **❌ Not started** | None |
| PR7 | Focus Queue system | **✅ Completed** | New tables |
| PR8 | Remaining enhancements (future) | **Deferred** | Various |

**Completed:** PRs 2, 3, 4, 5, 7 — Major UX overhaul, archive system, company linking, workspace layout, focus queue
**Remaining:** PR6 (email/calendar integration) and PR8 (future enhancements)

---

*Document updated: January 2026*
*Covers codebase as of commit `784e2ae` (focus queue hooks update)*
