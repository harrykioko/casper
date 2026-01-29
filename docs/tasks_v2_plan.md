# Tasks V2 — Audit, Gap Analysis & Implementation Plan

**Updated 2026-01-29** — Revised to simplify data model, unify notes through the polymorphic system, defer archive/importance columns, and clarify email linking semantics.

---

## 1. Current System Map

*(Unchanged from original audit. Retained here for reference.)*

### Data Model

**Primary table: `tasks`** (21 columns)

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
| `is_quick_task` | boolean | **"Inbox" flag** |
| `is_top_priority` | boolean | Top-priority pin |
| `snoozed_until` | timestamptz | Snooze target |
| `snooze_count` | integer | Times snoozed |
| `last_snoozed_at` | timestamptz | Last snooze timestamp |
| `effort_minutes` | integer | Effort estimate |
| `effort_category` | text | "quick"/"medium"/"deep"/"unknown" |

**Related tables:**
- `project_notes` + `note_links` — Polymorphic notes system. Notes stored in `project_notes`, linked to tasks via `note_links` where `target_type = 'task'`.
- `snooze_log` — Audit trail for snooze actions.
- `categories`, `projects` — Reference data.

**RLS:** `created_by = auth.uid()` pattern on all operations.

### Frontend Files

| File | Role |
|------|------|
| `src/hooks/useTasks.ts` | Core CRUD, transforms (`Task` interface, `transformTask`, `transformTaskForDatabase`, `createTask`, `updateTask`, `deleteTask`, `getInboxTasks`, `getNonInboxTasks`) |
| `src/hooks/useTasksManager.tsx` | Orchestrator: `handleAddTask` (sets `is_quick_task: true`), `handleCompleteTask`, `handleUpdateTaskStatus`, `handleUpdateTask`, `quickInlineUpdate`, `bulkUpdate` |
| `src/hooks/useTaskDetails.ts` | Form state for edit modal |
| `src/hooks/useTaskFiltering.ts` | Filter/sort logic (excludes inbox by default) |
| `src/hooks/useCompanyTasks.ts` | Tasks scoped to `company_id` with real-time subscription |
| `src/hooks/usePipelineTasks.ts` | Tasks scoped to `pipeline_company_id` with real-time subscription |
| `src/hooks/usePipelineTasksAggregate.ts` | Multi-company task aggregation for pipeline views |
| `src/hooks/useProjectTasks.ts` | Tasks scoped to `project_id` |
| `src/hooks/useTaskAttachments.ts` | Email attachments via `source_inbox_item_id` |
| `src/hooks/useNotes.ts` | Polymorphic notes: `useNotesForTarget`, `createNote`, `updateNote`, `deleteNote` |
| `src/pages/Tasks.tsx` | **Main page**: quick-add, view toggle, filters, inbox section, main content, task details modal |
| `src/components/tasks/QuickTaskInput.tsx` | Quick-add input (content only) |
| `src/components/tasks/ViewModeToggle.tsx` | List/Kanban toggle + inbox show/hide |
| `src/components/tasks/TasksFilters.tsx` | Filter bar (status, priority, category, project, sort) |
| `src/components/tasks/TasksMainContent.tsx` | List view container |
| `src/components/tasks/TasksKanbanView.tsx` | Kanban with drag-drop (react-beautiful-dnd) |
| `src/components/tasks/InboxSection.tsx` | Inbox triage UI with keyboard shortcuts, bulk actions |
| `src/components/tasks/kanban/InboxColumn.tsx` | Kanban inbox column |
| `src/components/modals/AddTaskDialog.tsx` | "New Task" modal (content + description textarea + company prefill display) |
| `src/components/modals/TaskDetailsDialog.tsx` | Edit task modal (form + notes section + attachments) |
| `src/components/modals/task-details/TaskDetailsForm.tsx` | Form fields container |
| `src/components/modals/task-details/TaskContentInput.tsx` | Title input |
| `src/components/modals/task-details/ProjectSelector.tsx` | Project dropdown |
| `src/components/modals/task-details/CategorySelector.tsx` | Category dropdown |
| `src/components/modals/task-details/DateSelector.tsx` | Due date picker |
| `src/components/modals/task-details/PrioritySelector.tsx` | Priority toggle group |
| `src/components/modals/task-details/StatusSelector.tsx` | Status toggle group |
| `src/components/notes/TaskNotesSection.tsx` | Notes list + editor for task detail modal |
| `src/components/tasks/TaskAttachmentsSection.tsx` | Email attachments display |
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
                                              TanStack Query invalidation → re-fetch
                                                     ↓
                                              getInboxTasks() filter → InboxSection UI

InboxSection triage → quickInlineUpdate / bulkUpdate → Supabase UPDATE
                                                     ↓
                                              (DB trigger clears is_quick_task when status ≠ 'todo')
                                                     ↓
                                              Task appears in main list (getNonInboxTasks)
```

---

## 2. Gap Analysis (Updated)

### Gap 1: AddTaskDialog "Notes" Textarea Is Not Persisted

**Where it manifests:** `AddTaskDialog.tsx:54-56` — The `taskDescription` state is captured in a `<Textarea>` but the `TaskCreateData` object built on submit only sets `content`. The `description` field exists on the `TaskCreateData` interface but is **never assigned** from `taskDescription`.

**Root cause:** Code omission — `taskData.description = taskDescription` is never called. Additionally, there is no `description` column on the `tasks` table, so even if assigned, the insert would drop it.

**V2 fix:** Do **not** add a `description` column. Instead, persist the textarea content as a polymorphic note via the existing `project_notes` + `note_links` system. After inserting the task, if the textarea is non-empty, call `createNote()` with `primaryContext: { targetType: 'task', targetId: newTask.id }`. This gives tasks exactly one text surface (title = `content`) plus N notes — no ambiguity about "description vs notes."

**UX label:** Rename the textarea from "Notes" / "Description" to **"Initial note"** (or "Context"). This makes it clear the text becomes the first entry in the task's notes list, not a separate field.

**Phase 2 consideration:** If a dedicated `tasks.description` column is later desired (e.g., for a pinned summary distinct from the notes stream), it can be added as a "promotion" of the first note: add the column, backfill from the earliest `project_notes` entry linked to each task, and adjust the UI to show it inline. Not in V2 scope.

### Gap 2: Triage (Inbox) Is a Parallel Boolean, Feels Mandatory

**Where it manifests:** `is_quick_task` boolean on `tasks` table. Frontend maps it to `inbox` property. All quick-add tasks enter inbox by default, and inbox tasks are excluded from the main task list until triaged.

**Root cause:** The "inbox" concept is an orthogonal boolean rather than a status value, creating a parallel state dimension. A task can be `status = 'todo'` AND `inbox = true`, requiring explicit triage before appearing in the main list.

**V2 fix:** Keep `is_quick_task` boolean (no schema migration). Changes are UX-only:
1. **Rename "Inbox" → "Triage"** across all UI labels, components, and copy.
2. **Add a one-click "Promote" action** on each triage task — clears `is_quick_task` without requiring any edits. Visible as a button/icon in `InboxSection` rows.
3. **Make triage non-blocking** — the section is collapsible (default: collapsed). Users who want a capture→triage flow can expand it; users who don't can ignore it entirely.
4. **Keep the DB trigger** that clears `is_quick_task` when status changes as an implementation detail. The "Promote" button is the explicit UX surface for the same operation.

**Phase 2 consideration:** Migrate `is_quick_task` to a status enum value `'triage'` if the boolean continues to cause confusion. Not in V2 scope.

### Gap 3: AddTaskDialog Lacks Company Linking UI

*(Unchanged from original.)*

**Fix:** Add a unified `CompanySelector` component to both `AddTaskDialog` and `TaskDetailsDialog`. Centralize the dual-FK mapping into helper functions (see Data Model section).

### Gap 4: TaskDetailsDialog Has No Company Linking

*(Unchanged from original.)*

**Fix:** Add `CompanySelector` to `TaskDetailsForm`. The `useTaskDetails` hook needs `companyId` and `companyType` state fields.

### Gap 5: No Aging for Completed Tasks

**Where it manifests:** Tasks page main list and kanban "Done" column. Completed tasks accumulate indefinitely.

**Root cause:** No time-based filtering is applied to completed tasks. The only filter is the manual status filter.

**V2 fix:** **Query/filter-only approach** — no new columns. Default fetch query excludes tasks where `completed_at` is older than 14 days. A "Show completed" toggle in the command bar overrides this filter and reveals all completed tasks. No `archived_at` column in V2.

**Phase 2 consideration:** Add `archived_at` column when explicit archive semantics are needed across tasks, company views, and email views. Add auto-archive cron job. Not in V2 scope.

### Gap 6: Tasks Not Visible in Email Detail Pane

**Where it manifests:** `InboxDetailDrawer.tsx` has a "Create Task" button but does not show existing tasks created from that email.

**V2 fix:** Query tasks where `source_inbox_item_id = currentEmail.id` and display them in a small section below the "Create Task" button. This shows **origin-linked tasks only** (tasks that were created from this email).

**Clarification on linking semantics:**
- `source_inbox_item_id` = **origin** ("this task was created from email X"). This is the only email→task relationship in V2.
- "Link an existing task to an email after the fact" = **association**. This would require a generalized link table (similar to `note_links` but for task↔entity associations). **Phase 2.**

### Gap 7: No "Create Follow-Up Task" from Calendar Events

*(Unchanged from original.)*

### Gap 8: `completed` Boolean Is Redundant with `status = 'done'`

*(Unchanged from original. Keep syncing both; new code treats `status` as source of truth.)*

### Gap 9: Tasks Page Layout Wastes Space

*(Unchanged from original.)*

### Gap 10: Importance Ranking

**V2 fix:** Use existing `is_top_priority` boolean as the single importance signal. Surface it more clearly in the UI (e.g., star icon toggle on task rows and in the detail panel).

**Phase 2 consideration:** Add `importance_rank smallint` column for numeric ranking / Eisenhower matrix. Not in V2 scope.

### Gap 11: Filters Don't Support Company Type

*(Unchanged from original.)*

---

## 3. Tasks V2 Data Model (Revised)

### Schema Changes

**None.** V2 requires zero schema migrations. All changes are frontend-only:

- **Notes persistence** → uses existing `project_notes` + `note_links` (already supports `target_type = 'task'`).
- **Company linking** → uses existing `company_id` and `pipeline_company_id` FKs.
- **Aging** → query-level filter on `completed_at`, no new column.
- **Importance** → uses existing `is_top_priority` boolean.
- **Triage** → keeps existing `is_quick_task` boolean with UX relabeling.

### Relationship Diagram (Unchanged)

```
tasks
  ├─── company_id ────────────→ companies (portfolio)
  ├─── pipeline_company_id ───→ pipeline_companies
  ├─── project_id ────────────→ projects
  ├─── category_id ───────────→ categories
  ├─── source_inbox_item_id ──→ inbox_items (email origin — "created from")
  ├─── created_by ────────────→ auth.users
  │
  └─── (via note_links.target_id where target_type='task')
       └── note_links ──→ project_notes (all task notes, including "initial note")
```

### Company Link Helper Functions (New)

To avoid scattering `if (type === 'pipeline') { pipeline_company_id } else { company_id }` throughout UI code, centralize into a shared utility:

```typescript
// src/lib/taskCompanyLink.ts

interface TaskCompanyLink {
  type: 'portfolio' | 'pipeline';
  id: string;
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
```

Consumed by: `CompanySelector`, `transformTaskForDatabase`, `AddTaskDialog`, `TaskDetailsDialog`.

### RLS Policy

No changes. Existing `created_by = auth.uid()` policies remain.

### Backfill Plan

No backfill needed. Zero schema changes means zero data migration.

### Phase 2 Schema Additions (Documented for Roadmap)

These columns are **not** part of V2 but are noted for future planning:

| Column | Purpose | Trigger |
|--------|---------|---------|
| `tasks.description` | Pinned summary text, promoted from first note | When users need a visible "description" distinct from notes stream |
| `tasks.archived_at` | Explicit archive flag | When aging needs to work across company/email views, or for auto-archive cron |
| `tasks.importance_rank` | Numeric importance (1-5) | When Eisenhower matrix or multi-axis sorting is needed |
| `task_entity_links` | Generic link table (task↔email, task↔event) | When bidirectional task↔email association is needed (beyond origin) |
| `task_activity` | Audit trail for field changes | When full activity log UX is built |

---

## 4. UX Redesign Spec (Updated)

### Tasks Page — Workspace Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ [+ Quick Add ___________________________________] [List|Kanban] │  ← Header bar
├─────────────────────────────────────────────────────────────────┤
│ [Search] [Status ▾] [Priority ▾] [Project ▾] [Company ▾]       │  ← Command bar
│ [Category ▾] [Sort: Due Date ▾]  [Show Completed ○]            │
├───────────────────────────────────────────────┬─────────────────┤
│                                               │  NOW RAIL       │
│  ▸ Triage (3)        [collapse] [Promote All] │                 │
│    ☐ Review deck      [→ Promote]             │  Overdue (2)    │
│    ☐ Follow up email  [→ Promote]             │  · Task A       │
│    ☐ Check pipeline   [→ Promote]             │  · Task B       │
│                                               │                 │
│  TASKS                                        │  Due Soon (3)   │
│  ────────────────────────────────────         │  · Task C       │
│  ☐ Prepare board memo  P1  ProjectX  Acme  📅 │  · Task D       │
│  ☐ Send term sheet     P2  DealY    Beta   📅 │  · Task E       │
│  ☐ Update model        P3  Ops                │                 │
│  ☑ Draft LP letter (done 2d ago)              │  ──────────     │
│                                               │  Open: 12       │
│                                               │  Overdue: 2     │
│                                               │  Done today: 4  │
└───────────────────────────────────────────────┴─────────────────┘
```

**Key changes from original plan:**
1. **"Show Completed" toggle** replaces "Show Archived" — controls the 14-day completed-task filter. No archive concept in V2.
2. **"Triage" section** has explicit **"Promote"** button per task (clears `is_quick_task`, moves task to main list with zero edits). Also a "Promote All" batch action in the section header.
3. **Triage defaults to collapsed.** Users who want capture→triage expand it. Users who don't never see it.
4. **Task rows** show company name chip (resolved via `getTaskCompanyLink`).
5. **Kanban** renames "Inbox" column to "Triage".
6. **`is_top_priority` surfaced as star icon** on task rows — clickable toggle.

### Task Detail Panel (Slide-Over)

```
┌──────────────────────────────────┐
│ ← Back          Task Detail   ⋮  │
├──────────────────────────────────┤
│                                  │
│ TITLE                            │
│ [Prepare board memo____________] │
│                                  │
│ ─── PROPERTIES ─────────────     │
│ Status:     [● In Progress ▾]    │
│ Priority:   [P1 ▾]              │
│ Important:  [★ toggle]           │
│ Due Date:   [Jan 30, 2026 ▾]    │
│ Project:    [Board Meetings ▾]   │
│ Category:   [Ops ▾]             │
│ Company:    [Acme Corp ▾]  🏢   │
│                                  │
│ ─── LINKS ──────────────────     │
│ 📧 Created from: "Re: Board..." │
│                                  │
│ ─── NOTES (2) ──────────────     │
│ Jan 28 — Updated with Q4 data   │
│ Jan 25 — Need to include Q4     │
│          numbers and portfolio   │
│          performance (initial)   │
│ [+ Add note]                     │
│                                  │
│ ─── ATTACHMENTS (1) ────────     │
│ 📎 board_deck_v3.pdf  2.1MB     │
│                                  │
│ ─── ACTIVITY (stub) ────────     │
│ Jan 28 — Status → In Progress    │
│ Jan 25 — Created from email      │
│                                  │
├──────────────────────────────────┤
│ [🗑 Delete]        [Cancel][Save]│
└──────────────────────────────────┘
```

**Changes from original plan:**
1. **No "Description" section.** Title is the only top-level text field. All contextual text lives in Notes.
2. **"Important" is a simple star toggle** — maps to `is_top_priority`. No star rating, no 1-5 scale.
3. **Notes section** is the single place for all text beyond the title. The "initial note" (from AddTaskDialog) appears here as the first entry, tagged "(initial)" for clarity.
4. **Links section** shows `source_inbox_item_id` as a clickable "Created from: [email subject]" chip. No bidirectional email association in V2 — only origin.
5. **Activity section** is a stub showing `created_at` and `updated_at` timestamps. Full field-change audit trail is Phase 2.
6. **Company selector** uses `CompanySelector` component backed by `getTaskCompanyLink` / `setTaskCompanyLink` helpers.

**Existing design patterns to reuse:**
- `GlassModal` / `GlassModalContent` for the container (or convert to a drawer matching `InboxDetailDrawer`)
- `TaskNotesSection` for notes (already built, uses `useNotesForTarget`)
- `TaskAttachmentsSection` for attachments (already built)
- `ProjectSelector`, `CategorySelector`, `DateSelector`, `PrioritySelector`, `StatusSelector` — all exist

### AddTaskDialog — Updated Flow

```
┌──────────────────────────────────┐
│ ✓ Add New Task                   │
├──────────────────────────────────┤
│ Task                             │
│ [Enter task title_______________]│
│                                  │
│ Initial note (optional)          │
│ [Add context, details, or       ]│
│ [background for this task...    ]│
│                                  │
│ Company (optional)               │
│ [🔍 Search companies...]        │
│                                  │
│ Related to: Acme Corp  (if pre-  │
│   filled from email context)     │
│                                  │
├──────────────────────────────────┤
│              [Cancel] [Add Task] │
└──────────────────────────────────┘
```

**Persistence flow on submit:**
1. Insert task row (`content`, `source_inbox_item_id`, company FKs via `setTaskCompanyLink`).
2. If "Initial note" textarea is non-empty: call `createNote({ content: noteText, primaryContext: { targetType: 'task', targetId: newTask.id } })`.
3. Both operations happen sequentially (task insert must succeed first to get the `id`).

---

## 5. Global Integration Points (Updated)

### 5A. Company Detail Pane — Tasks Tab

**Already exists:** `CompanyCommandTasks.tsx` using `useCompanyTasks` / `usePipelineTasks`.

**No code change needed** — tasks linked via company FKs already appear here via real-time Supabase subscriptions.

### 5B. Email Detail Pane — Show Origin Tasks

**File to modify:** `src/components/dashboard/InboxDetailDrawer.tsx`

**Change:** Below the "Create Task" button, add a section showing tasks where `source_inbox_item_id = currentEmail.id`. These are **origin tasks** — tasks that were created from this specific email.

**New hook:** `src/hooks/useEmailOriginTasks.ts`
```typescript
// Fetches tasks created FROM a specific email (origin relationship)
export function useEmailOriginTasks(inboxItemId: string | undefined) {
  return useQuery({
    queryKey: ['email-origin-tasks', inboxItemId],
    queryFn: () => supabase
      .from('tasks')
      .select('id, content, status, completed, priority, completed_at')
      .eq('source_inbox_item_id', inboxItemId),
    enabled: !!inboxItemId,
  });
}
```

Render as a small list with completion toggles. Reuse `TaskCardContent` + `TaskCardMetadata`.

**Naming note:** The hook and section are called "origin tasks" (not "linked tasks") to distinguish from Phase 2 bidirectional associations.

**Phase 2:** "Link existing task to email" via a generalized `task_entity_links` table. Not in V2.

### 5C. Calendar Event Detail — "Create Follow-Up Task"

*(Unchanged from original.)*

**File to modify:** Event detail modal component.

**Change:** Add "Create Follow-Up Task" button opening `AddTaskDialog` with prefill:
- `content`: `Follow up: ${event.title}`
- `dueDate`: event end time + 1 day
- `companyId` / `companyType` / `companyName`: resolved via domain matching if event attendees match a company

No schema change needed.

### 5D. Company Timeline — Task Events

**Already exists.** `useCompanyTimeline.ts` merges task_created/task_completed into the timeline. No change needed.

---

## 6. Aging Logic (Revised — Filter-Only)

### Default Behavior

1. **Completed tasks older than 14 days** are excluded from default task queries.
2. They remain in the database, unchanged.
3. A **"Show completed"** toggle in the command bar removes the age filter and shows all completed tasks.
4. No `archived_at` column. No backfill. No cron job. Pure query/filter approach.

### Query Logic

**Current query (non-inbox tasks):**
```sql
SELECT * FROM tasks
WHERE created_by = auth.uid()
  AND is_quick_task IS NOT TRUE
ORDER BY created_at DESC;
```

**V2 query (default — hides old completed):**
```sql
SELECT * FROM tasks
WHERE created_by = auth.uid()
  AND is_quick_task IS NOT TRUE
  AND (
    completed IS NOT TRUE
    OR completed_at > now() - interval '14 days'
  )
ORDER BY created_at DESC;
```

**V2 query (with "Show completed" toggle ON):**
```sql
SELECT * FROM tasks
WHERE created_by = auth.uid()
  AND is_quick_task IS NOT TRUE
ORDER BY created_at DESC;
```

### Implementation

**Files to modify:**
- `src/hooks/useTasks.ts` — add `showAllCompleted` parameter to the fetch query. When `false` (default), append `.or('completed.is.null,completed.eq.false,completed_at.gt.' + fourteenDaysAgo)` to the Supabase query.
- `src/hooks/useTaskFiltering.ts` — thread `showAllCompleted` through.
- `src/pages/Tasks.tsx` — add `showCompleted` state (default `false`), pass to hooks.
- `src/components/tasks/TasksFilters.tsx` — add "Show completed" toggle switch.

### Index Recommendation

For performance on the aging filter, add an index (this is the only DB change in V2 related to aging, and it's optional/additive):

```sql
CREATE INDEX idx_tasks_completed_aging ON tasks (created_by, completed_at)
WHERE completed_at IS NOT NULL;
```

### Phase 2: Explicit Archive

When needed:
- Add `archived_at` column.
- Add "Archive" button to task detail panel.
- Auto-archive cron: `UPDATE tasks SET archived_at = now() WHERE completed_at < now() - interval '30 days'`.
- Separate "Show archived" toggle.

---

## 7. Implementation Plan (Revised PR Sequence)

### PR1: Fix Note Persistence via Polymorphic Notes

**Goal:** Fix the most immediate bug — "Initial note" text entered in AddTaskDialog is not saved. Use the existing polymorphic notes system.

**Schema migration:** None.

**Files to modify:**
- `src/components/modals/AddTaskDialog.tsx`:
  - Rename `<Label>` from "Notes" to **"Initial note"**.
  - After successful task insert, if textarea is non-empty, call `createNote()` with `primaryContext: { targetType: 'task', targetId: newTask.id }`.
  - Import and use `createNote` from `useNotes.ts`.
  - Change `onAddTask` callback to return the created task (needs the `id` for the note insert).
- `src/hooks/useTasksManager.tsx`:
  - Update `handleAddTask` to accept `TaskCreateData` object (not just `content` string).
  - Return the created task from `createTask` so the caller can use `task.id` for the note.
- `src/hooks/useTasks.ts`:
  - Ensure `createTask` returns the created task row (it already does via `.select().single()`; verify the return is propagated).
- `src/pages/Tasks.tsx`:
  - Update `handleAddTask_click` to pass `TaskCreateData` through.
- `src/components/tasks/QuickTaskInput.tsx` — **no change** (quick-add stays content-only).

**Manual test checklist:**
- [ ] Open AddTaskDialog → enter title + initial note → save → open task detail → verify note appears in TaskNotesSection
- [ ] Open AddTaskDialog → enter title only (no note) → save → verify no empty note is created
- [ ] Open TaskDetailsDialog → verify existing notes display correctly (no regression)
- [ ] Add a second note via TaskNotesSection → verify both initial and new notes appear
- [ ] Create task from email (InboxDetailDrawer) → verify `source_inbox_item_id` is set and prefilled note persists

---

### PR2: Company Selector + Link Helpers

**Goal:** Allow linking tasks to companies from both AddTaskDialog and TaskDetailsDialog. Centralize dual-FK logic.

**Schema migration:** None.

**Files to create:**
- `src/lib/taskCompanyLink.ts` — `getTaskCompanyLink()` and `setTaskCompanyLink()` helper functions (as specified in Data Model section).
- `src/components/modals/task-details/CompanySelector.tsx` — search input + dropdown listing portfolio + pipeline companies. Returns `TaskCompanyLink | null`. Consumes a unified company search hook.

**Files to modify:**
- `src/hooks/useTaskDetails.ts` — add `companyLink: TaskCompanyLink | null` state; populate from task on load using `getTaskCompanyLink`.
- `src/components/modals/task-details/TaskDetailsForm.tsx` — add `CompanySelector` below project selector.
- `src/components/modals/AddTaskDialog.tsx` — add `CompanySelector`; populate from prefill if available, allow manual selection otherwise.
- `src/hooks/useTasksManager.tsx` — in `handleUpdateTask`, spread `setTaskCompanyLink(companyLink)` into the update payload.
- `src/hooks/useTasks.ts` — ensure `transformTask` populates company link info; ensure `transformTaskForDatabase` uses `setTaskCompanyLink`.

**Manual test checklist:**
- [ ] Open AddTaskDialog → search for and select a portfolio company → save → verify `company_id` in DB
- [ ] Open AddTaskDialog → search for and select a pipeline company → save → verify `pipeline_company_id` in DB
- [ ] Open TaskDetailsDialog for a task with company → verify company shown in selector
- [ ] Change company in TaskDetailsDialog → save → verify FK updated (old FK nulled, new FK set)
- [ ] Clear company in TaskDetailsDialog → save → verify both FKs nulled
- [ ] Go to company detail pane → verify task appears in company tasks tab

---

### PR3: Triage UX (Rename + Promote + Collapse)

**Goal:** Make triage optional and non-blocking. Rename Inbox → Triage. Add one-click Promote.

**Schema migration:** None.

**Files to modify:**
- `src/components/tasks/InboxSection.tsx`:
  - Rename all "Inbox" labels to **"Triage"**.
  - Add **"Promote"** button per task row (calls `quickInlineUpdate(taskId, { is_quick_task: false })`).
  - Add **"Promote All"** button in section header.
  - Default section to **collapsed** (user expands if desired).
- `src/components/tasks/kanban/InboxColumn.tsx` — rename "Inbox" to "Triage".
- `src/components/tasks/ViewModeToggle.tsx` — rename "Show Inbox" toggle to "Show Triage".
- `src/components/tasks/TasksKanbanView.tsx` — rename "Inbox" column header.
- `src/pages/Tasks.tsx` — change `showInbox` default from `true` to `false`.

**Manual test checklist:**
- [ ] All UI labels read "Triage" (no "Inbox" anywhere in task UI)
- [ ] Triage section defaults to collapsed
- [ ] Expand triage → click "Promote" on a task → task disappears from triage, appears in main list
- [ ] Click "Promote All" → all triage tasks move to main list
- [ ] Kanban "Triage" column works with drag-and-drop (unchanged behavior, new label)
- [ ] Creating a task via quick-add still sets `is_quick_task: true` (enters triage)

---

### PR4: Aging Logic (Completed Task Filtering)

**Goal:** Stop completed tasks from cluttering the default view.

**Schema migration:** Optional index only:
```sql
CREATE INDEX idx_tasks_completed_aging ON tasks (created_by, completed_at)
WHERE completed_at IS NOT NULL;
```

**Files to modify:**
- `src/hooks/useTasks.ts` — add `showAllCompleted` parameter to fetch query; apply 14-day filter on `completed_at` when `false`.
- `src/hooks/useTaskFiltering.ts` — thread `showAllCompleted` through.
- `src/pages/Tasks.tsx` — add `showCompleted` state (default: `false`), pass to hooks.
- `src/components/tasks/TasksFilters.tsx` — add "Show completed" toggle switch.

**Manual test checklist:**
- [ ] Complete a task → verify it remains visible (within 14-day window)
- [ ] Tasks completed > 14 days ago → verify hidden by default
- [ ] Toggle "Show completed" ON → verify all completed tasks reappear
- [ ] Toggle "Show completed" OFF → verify old completed tasks hide again
- [ ] Kanban "Done" column respects the same filter

---

### PR5: Tasks Page Command Bar + Workspace Layout

**Goal:** Improve task page density and add company/search filtering.

**Files to modify:**
- `src/pages/Tasks.tsx` — restructure layout: two-column (main + Now rail on desktop).
- `src/components/tasks/TasksCommandBar.tsx` — **new**: unified bar with search, filters, view toggle, "Show completed" toggle.
- `src/components/tasks/NowRail.tsx` — **new**: right sidebar showing overdue tasks, due-soon tasks, quick stats. `is_top_priority` tasks highlighted with star.
- `src/components/tasks/TasksFilters.tsx` — refactor into command bar; add company filter dropdown.
- `src/components/tasks/ViewModeToggle.tsx` — integrate into command bar.

**Manual test checklist:**
- [ ] Tasks page renders with command bar, main content, and Now rail
- [ ] Search filters tasks by content in real-time
- [ ] Company filter shows matching tasks (portfolio + pipeline)
- [ ] All existing filters still work
- [ ] Now rail shows overdue and due-soon counts, starred tasks highlighted
- [ ] Mobile: Now rail hides, command bar wraps gracefully

---

### PR6: Task Detail Slide-Over Panel

**Goal:** Convert task detail modal to a slide-over panel with company linking and improved layout.

**Files to modify:**
- `src/components/modals/TaskDetailsDialog.tsx` — convert from `GlassModal` to slide-over drawer.
- `src/components/modals/task-details/TaskDetailsForm.tsx` — restructure into sections: Properties, Links, Notes, Attachments, Activity (stub).
- `src/components/modals/task-details/TaskLinksSection.tsx` — **new**: shows source email as clickable "Created from: [subject]" chip.
- `src/components/modals/task-details/TaskActivitySection.tsx` — **new**: stub showing `created_at` and `updated_at`. Full audit trail is Phase 2.
- `src/components/modals/task-details/ImportanceToggle.tsx` — **new**: star icon toggle for `is_top_priority`.

**Manual test checklist:**
- [ ] Click task → slide-over panel opens from right
- [ ] All fields editable (content, status, priority, is_top_priority, date, project, category, company)
- [ ] Notes section works (existing notes + add new)
- [ ] Initial note from AddTaskDialog appears in notes list
- [ ] Attachments section shows for email-sourced tasks
- [ ] Links section shows source email (clickable)
- [ ] Activity stub shows timestamps
- [ ] Ctrl+S saves, Esc closes

---

### PR7: Email + Calendar Task Integration

**Goal:** Show origin tasks in email detail pane; add "Create Follow-Up" to calendar events.

**Files to create:**
- `src/hooks/useEmailOriginTasks.ts` — `useEmailOriginTasks(inboxItemId)` hook.

**Files to modify:**
- `src/components/dashboard/InboxDetailDrawer.tsx` — add "Tasks from this email" section using `useEmailOriginTasks`; show completion toggles.
- Event detail modal component — add "Create Follow-Up Task" button opening `AddTaskDialog` with prefill.

**Manual test checklist:**
- [ ] Open email detail that has origin tasks → see task list
- [ ] Toggle complete on origin task from email detail → verify status updates
- [ ] Open email with no tasks → section shows "No tasks" or is hidden
- [ ] Open calendar event → click "Create Follow-Up Task" → dialog opens with correct prefill
- [ ] Save follow-up task → verify it appears in main tasks list with correct due date and company

---

### Phase 2 PRs (Documented, Not in V2)

| Enhancement | Trigger | Scope |
|-------------|---------|-------|
| `tasks.description` column | Need pinned summary distinct from notes | Add column + backfill from first note + UI field |
| `archived_at` column + auto-archive | Need explicit archive across views | Add column + cron + "Archive" button + "Show archived" toggle |
| `importance_rank` column | Need numeric ranking / Eisenhower matrix | Add column + UI selector + sort option |
| `task_entity_links` table | Need bidirectional task↔email/event association | New table + "Link to email" UI in task detail |
| `task_activity` table | Need full audit trail | New table + triggers + activity feed UI |
| Triage → status migration | Boolean continues to cause confusion | Migrate `is_quick_task` → `status = 'triage'` + drop column |

---

## Summary

| PR | Scope | Risk | Schema Change |
|----|-------|------|---------------|
| PR1 | Fix note persistence (polymorphic notes) | Low | None |
| PR2 | Company selector + link helpers | Low | None |
| PR3 | Triage UX (rename + promote + collapse) | Low | None |
| PR4 | Aging logic (query filter only) | Low | Optional index |
| PR5 | Workspace layout + command bar | Medium | None |
| PR6 | Slide-over detail panel | Medium | None |
| PR7 | Email/calendar integration | Low | None |

**Key difference from original plan:** Zero required schema migrations in V2. All changes are frontend code + one optional index. This reduces deployment risk and makes every PR independently shippable without coordinating DB changes.
