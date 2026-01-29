  # Tasks V2 — Audit, Gap Analysis & Implementation Plan

  ---

  ## 1. Current System Map

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

  ## 2. Gap Analysis

  ### Gap 1: Quick-Add Notes Are Not Persisted

  **Where it manifests:** `AddTaskDialog.tsx:54-56` — The `taskDescription` state is captured in a `<Textarea>` but the `TaskCreateData` object built on submit only ever sets `content`. The `description` field exists on `TaskCreateData` interface but is **never assigned** from `taskDescription`.

  **Root cause:** Code omission. Line 54-56 builds `taskData` with only `content`, never `taskData.description = taskDescription`. Furthermore, even if it were set, the `tasks` table has **no `description` column** — the description would need to be persisted as a polymorphic note via `project_notes` + `note_links`.

  **Fix:** After creating the task, if `taskDescription` is non-empty, create a `project_notes` entry linked via `note_links` with `target_type = 'task'`. Alternatively, add a `description` column to `tasks` for simple one-liner notes.

  **Recommendation:** Add a `description` text column to `tasks` (simple, inline with the task) **and** keep the polymorphic notes system for longer threaded notes. This mirrors how most task tools have a "description" field plus a "comments/notes" section.

  ### Gap 2: Inbox Is a Boolean Flag, Not a Status

  **Where it manifests:** `is_quick_task` boolean on `tasks` table. Frontend maps it to `inbox` property.

  **Root cause:** The "inbox" concept is implemented as an orthogonal boolean (`is_quick_task`) rather than as a value in the `status` enum. This creates a parallel state dimension: a task can be `status = 'todo'` AND `inbox = true`, which leads to the confusing dual-gating where inbox tasks are filtered out of the main list by default.

  **Why it's confusing:** Users must "triage" inbox tasks before they appear in the real task list. There is a DB trigger that clears `is_quick_task` when status changes, but this implicit behavior is not surfaced clearly in the UI.

  **Fix direction:** Convert inbox to an explicit status value. Add `"inbox"` as a status option. Remove `is_quick_task` column. Tasks created from quick-add start with `status = 'inbox'`. Triaging sets status to `'todo'` (or another value). This eliminates the parallel boolean state.

  ### Gap 3: AddTaskDialog Lacks Company Linking UI

  **Where it manifests:** `AddTaskDialog.tsx` — The modal only shows company info if `prefill.companyName` is provided (read-only display). There is no search/select UI for choosing a company.

  **Root cause:** The dialog was designed for the email→task flow where company is pre-known. No company search component was built into it.

  **Fix:** Add a company search/select component to `AddTaskDialog` and `TaskDetailsDialog`. The `CompanyCommandTasks` component already has inline task creation with company context, so the pattern exists — it just needs to be exposed in the standalone dialogs.

  ### Gap 4: TaskDetailsDialog Has No Company Linking

  **Where it manifests:** `TaskDetailsDialog.tsx` / `TaskDetailsForm.tsx` — The edit form has fields for content, status, date, project, priority, category. **No company selector.**

  **Root cause:** The form was built without company awareness. The `useTaskDetails` hook doesn't manage `company_id` or `pipeline_company_id`.

  **Fix:** Add a `CompanySelector` component to `TaskDetailsForm` (similar to `ProjectSelector`). The `useTaskDetails` hook needs `companyId` and `companyType` state fields.

  ### Gap 5: No Aging/Archive for Completed Tasks

  **Where it manifests:** Tasks page main list and kanban "Done" column. Completed tasks accumulate indefinitely.

  **Root cause:** No `archived_at` column exists. No time-based filtering is applied. The only filter is the manual status filter.

  **Fix:** Add `archived_at` timestamptz column. Implement default query filter: exclude tasks where `completed_at` is older than 14 days (or user-configured). Add "Show archived" toggle. Optionally, add a scheduled function or client-side logic to auto-set `archived_at` for tasks completed > N days ago.

  ### Gap 6: Tasks Not Visible in Email Detail Pane

  **Where it manifests:** `InboxDetailDrawer.tsx` has a "Create Task" button but does not show existing tasks linked to that email.

  **Root cause:** No query fetches tasks by `source_inbox_item_id` in the email detail view.

  **Fix:** In `InboxDetailDrawer`, query `tasks` where `source_inbox_item_id = currentEmail.id` and render them in a small section. Reuse `useCompanyTasks`-style hook pattern.

  ### Gap 7: No "Create Follow-Up Task" from Calendar Events

  **Where it manifests:** Calendar event detail modal shows event info but has no task creation action.

  **Root cause:** Feature not built. No link from calendar events to tasks exists in the schema.

  **Fix:** Add a "Create Follow-Up Task" button to `EventDetailsModal`. Pre-fill task content with event title, due date with event date + 1 day, and company if the event matches a company via domain. No schema change needed (tasks already have `scheduled_for` and company FKs).

  ### Gap 8: `completed` Boolean Is Redundant with `status = 'done'`

  **Where it manifests:** `handleCompleteTask` in `useTasksManager.tsx:14-21` sets both `completed` and `status` in parallel. Various filters check either or both.

  **Root cause:** Legacy design. `completed` was the original field; `status` was added later with the kanban view.

  **Fix direction:** Deprecate `completed` boolean over time. For now, keep syncing both. In V2, `status = 'done'` is the source of truth; `completed` becomes a computed/legacy field. No immediate migration needed — just ensure all new code checks `status`.

  ### Gap 9: Tasks Page Layout Wastes Space

  **Where it manifests:** `Tasks.tsx` — Linear vertical stack: quick-add → view toggle → filters → inbox → main content. No side panels or workspace density.

  **Root cause:** The page was built as a simple stacked layout without workspace-style density. The task detail is a full-screen modal overlay, not an inline panel.

  **Fix:** Redesign to a workspace layout: compact header with command bar, optional side rail for "Now" view / quick stats, task detail as a slide-over panel rather than a centered modal. Details in UX section below.

  ### Gap 10: No Importance Ranking Separate from Priority

  **Where it manifests:** `is_top_priority` boolean exists but is a simple pin. Priority is "low/medium/high". No separate importance dimension.

  **Root cause:** Only `priority` (urgency) exists. No importance axis.

  **Fix:** Add `importance` integer field (1-5 or 1-3) for Eisenhower-matrix style filtering. Or repurpose `is_top_priority` as the importance signal and rename it in the UI to be clearer. **Recommendation:** Keep it simple — use `is_top_priority` as the importance flag for now. Add a numeric `importance_rank` column later if needed.

  ### Gap 11: Filters Don't Support Company Type

  **Where it manifests:** `TasksFilters.tsx` has category, project, status, priority, sort — no company filter.

  **Root cause:** Filter component wasn't built with company awareness.

  **Fix:** Add "Company" filter dropdown that searches across portfolio + pipeline companies. Query tasks by `company_id` or `pipeline_company_id`.

  ---

  ## 3. Tasks V2 Data Model

  ### Schema Changes (Minimal)

  **ALTER `tasks` table — add columns:**

  ```sql
  -- Task description (inline short notes, distinct from threaded notes)
  ALTER TABLE tasks ADD COLUMN description text;

  -- Archive support
  ALTER TABLE tasks ADD COLUMN archived_at timestamptz;

  -- Importance rank (1=highest, null=unranked)
  ALTER TABLE tasks ADD COLUMN importance_rank smallint CHECK (importance_rank BETWEEN 1 AND 5);

  -- Index for archive queries
  CREATE INDEX idx_tasks_archived ON tasks (created_by, archived_at) WHERE archived_at IS NOT NULL;

  -- Index for completed aging queries
  CREATE INDEX idx_tasks_completed_aging ON tasks (created_by, completed_at) WHERE completed_at IS NOT NULL;
  ```

  **No new tables needed.** The existing `project_notes` + `note_links` system handles threaded notes. Company linking already exists via `company_id` and `pipeline_company_id`.

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
  ```

  ### RLS Policy (Unchanged Pattern)

  ```sql
  -- Same pattern as existing:
  CREATE POLICY "Users can manage their own tasks"
    ON tasks FOR ALL
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());
  ```

  No changes to RLS needed since we're only adding columns.

  ### Backfill Plan

  1. `description` — no backfill needed (all existing tasks have `NULL`).
  2. `archived_at` — backfill: `UPDATE tasks SET archived_at = completed_at WHERE completed = true AND completed_at < now() - interval '30 days'`. This hides old completed tasks from default views.
  3. `importance_rank` — no backfill needed (optional field).

  ### Inbox Status Migration (Optional, Recommended)

  **Option A (Recommended): Keep `is_quick_task` but rename in UI.**
  - Rename "Inbox" to "Triage" in the UI.
  - Make the triage section opt-in (collapsed by default for users who don't want it).
  - No schema change. Low risk.

  **Option B: Convert to status value.**
  - Add `'inbox'` as a status value, migrate `is_quick_task = true` tasks to `status = 'inbox'`.
  - Drop `is_quick_task` column after migration.
  - Higher risk, touches more code paths (DB triggers, filters, kanban columns).

  **Recommendation: Option A** for now. Rename in UI, make it less mandatory. Revisit Option B in a future iteration if the boolean still causes issues.

  ---

  ## 4. UX Redesign Spec

  ### Tasks Page — Workspace Layout

  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │ [+ Quick Add ___________________________________] [List|Kanban] │  ← Header bar
  ├─────────────────────────────────────────────────────────────────┤
  │ [Search] [Status ▾] [Priority ▾] [Project ▾] [Company ▾]       │  ← Command bar
  │ [Category ▾] [Sort: Due Date ▾]  [Show Archived ○]             │
  ├───────────────────────────────────────────────┬─────────────────┤
  │                                               │  NOW RAIL       │
  │  ▸ Triage (3)        [collapse]               │                 │
  │    ☐ Review deck from Acme Corp               │  Overdue (2)    │
  │    ☐ Follow up on intro email                 │  · Task A       │
  │    ☐ Check pipeline data                      │  · Task B       │
  │                                               │                 │
  │  TASKS                                        │  Due Soon (3)   │
  │  ────────────────────────────────────         │  · Task C       │
  │  ☐ Prepare board memo        P1  ProjectX  📅 │  · Task D       │
  │  ☐ Send term sheet           P2  DealY     📅 │  · Task E       │
  │  ☐ Update portfolio model    P3  Ops          │                 │
  │  ☑ Draft LP letter (done)                     │  ──────────     │
  │                                               │  Open: 12       │
  │                                               │  Overdue: 2     │
  │                                               │  Done today: 4  │
  └───────────────────────────────────────────────┴─────────────────┘
  ```

  **Key changes:**
  1. **Command bar** replaces stacked filter rows. Inline search + filter dropdowns + archive toggle in one row.
  2. **"Triage" replaces "Inbox"** — collapsible, off by default for users who prefer direct creation.
  3. **Right "Now" rail** (desktop only) — shows overdue + due-soon + quick stats. Always visible.
  4. **Task rows** show company name chip alongside project/priority/date.
  5. **Kanban** retains current 4-column layout but renames "Inbox" column to "Triage".

  ### Task Detail Modal → Slide-Over Panel

  Replace the centered `GlassModal` with a right slide-over panel (consistent with `InboxDetailDrawer` pattern):

  ```
  ┌──────────────────────────────────┐
  │ ← Back          Task Detail   ⋮  │
  ├──────────────────────────────────┤
  │                                  │
  │ TITLE                            │
  │ [Prepare board memo____________] │
  │                                  │
  │ DESCRIPTION                      │
  │ [Need to include Q4 numbers     ]│
  │ [and portfolio performance      ]│
  │                                  │
  │ ─── PROPERTIES ─────────────     │
  │ Status:    [● In Progress ▾]     │
  │ Priority:  [P1 ▾]               │
  │ Importance: [★★★☆☆]             │
  │ Due Date:  [Jan 30, 2026 ▾]     │
  │ Project:   [Board Meetings ▾]    │
  │ Category:  [Ops ▾]              │
  │ Company:   [Acme Corp ▾]  🏢    │
  │                                  │
  │ ─── LINKS ──────────────────     │
  │ 📧 Created from: "Re: Board..." │
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
  │ Jan 28 — Status → In Progress    │
  │ Jan 25 — Created from email      │
  │                                  │
  ├──────────────────────────────────┤
  │ [🗑 Delete]        [Cancel][Save]│
  └──────────────────────────────────┘
  ```

  **New sections in the detail panel:**
  1. **Description field** — persisted to `tasks.description` column.
  2. **Company selector** — search across portfolio + pipeline companies.
  3. **Importance** — star rating or simple 1-5 selector.
  4. **Links section** — shows source email (clickable), linked company.
  5. **Activity log** — status changes, due date changes. Read from `updated_at` diffs or a lightweight audit approach. *Phase 2 — stub the section initially.*

  **Existing design patterns to reuse:**
  - `GlassModal` / `GlassModalContent` for the container (or convert to a drawer)
  - `CompanyCommandPane` slide-over pattern for the panel approach
  - `TaskNotesSection` for notes (already built)
  - `TaskAttachmentsSection` for attachments (already built)
  - `ProjectSelector`, `CategorySelector`, `DateSelector`, `PrioritySelector`, `StatusSelector` — all already exist

  ---

  ## 5. Global Integration Points

  ### 5A. Company Detail Pane — Tasks Tab

  **Already exists:** `src/components/command-pane/CompanyCommandTasks.tsx`

  Uses `useCompanyTasks` / `usePipelineTasks`. Tasks linked via `company_id` / `pipeline_company_id` already appear here.

  **Improvement needed:** When a task is linked to a company via the new `CompanySelector` in `TaskDetailsDialog`, it should immediately appear in the company's tasks tab. Currently this works via real-time Supabase subscriptions — **no code change needed** as long as the company FK is set correctly on save.

  ### 5B. Email Detail Pane — Show Linked Tasks

  **File to modify:** `src/components/dashboard/InboxDetailDrawer.tsx`

  **Current state:** Has "Create Task" button. Does NOT show existing tasks linked to this email.

  **Change:** After the "Create Task" button, add a section:

  ```tsx
  // New: show tasks created from this email
  const { data: linkedTasks } = useQuery({
    queryKey: ['email-tasks', inboxItem.id],
    queryFn: () => supabase
      .from('tasks')
      .select('id, content, status, completed, priority')
      .eq('source_inbox_item_id', inboxItem.id)
  });
  ```

  Render as a small list with completion toggles. Reuse `TaskCardContent` + `TaskCardMetadata` components.

  ### 5C. Calendar Event Detail — "Create Follow-Up Task"

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

  No schema change needed.

  ### 5D. Company Timeline — Task Events

  **Already exists:** `src/hooks/useCompanyTimeline.ts` merges task_created/task_completed into the timeline.

  **No change needed** — task events already flow into the timeline when `company_id` or `pipeline_company_id` is set.

  ---

  ## 6. Aging Logic Proposal

  ### Default Behavior

  1. **Completed tasks older than 14 days** are hidden from the main tasks list and kanban by default.
  2. They remain in the database and are queryable.
  3. A "Show completed" toggle in the command bar reveals them.
  4. Tasks with `archived_at IS NOT NULL` are hidden from all default views.

  ### Query Logic

  **Current query (non-inbox tasks):**
  ```sql
  SELECT * FROM tasks
  WHERE created_by = auth.uid()
    AND is_quick_task IS NOT TRUE
  ORDER BY created_at DESC;
  ```

  **V2 query:**
  ```sql
  SELECT * FROM tasks
  WHERE created_by = auth.uid()
    AND is_quick_task IS NOT TRUE
    AND archived_at IS NULL
    AND (
      completed IS NOT TRUE
      OR completed_at > now() - interval '14 days'
    )
  ORDER BY created_at DESC;
  ```

  ### UI Toggles

  In the command bar filters area:

  - **"Show completed"** toggle (default: ON for last 14 days, OFF for older)
  - **"Show archived"** toggle (default: OFF)

  When "Show completed" is toggled ON, all completed tasks appear (including old ones). When toggled OFF, only incomplete tasks show.

  ### Auto-Archive (Optional, Phase 2)

  A Supabase Edge Function or pg_cron job that runs daily:

  ```sql
  UPDATE tasks
  SET archived_at = now()
  WHERE completed = true
    AND completed_at < now() - interval '30 days'
    AND archived_at IS NULL;
  ```

  This is optional. The query-level filtering already handles hiding old completed tasks. Auto-archive just sets an explicit flag for long-term management.

  ### Backfill

  ```sql
  -- Archive completed tasks older than 30 days
  UPDATE tasks
  SET archived_at = completed_at
  WHERE completed = true
    AND completed_at < now() - interval '30 days'
    AND archived_at IS NULL;
  ```

  ---

  ## 7. Implementation Plan (PR Sequence)

  ### PR1: Fix Quick-Add Note Persistence + Add Description Column

  **Goal:** Fix the most immediate bug — notes/description entered in AddTaskDialog are not saved.

  **Schema migration:**
  ```sql
  ALTER TABLE tasks ADD COLUMN description text;
  ```

  **Files to modify:**
  - `supabase/migrations/YYYYMMDD_add_task_description.sql` — migration
  - `src/integrations/supabase/types.ts` — regenerate types (add `description` to tasks Row/Insert/Update)
  - `src/hooks/useTasks.ts` — add `description` to `Task` interface and both transform functions
  - `src/components/modals/AddTaskDialog.tsx` — **fix line 54**: include `description: taskDescription` in `taskData` when non-empty
  - `src/hooks/useTasksManager.tsx` — update `handleAddTask` to accept `TaskCreateData` instead of just `content` string
  - `src/pages/Tasks.tsx` — update `handleAddTask_click` to pass through `TaskCreateData`
  - `src/components/tasks/QuickTaskInput.tsx` — no change (quick-add stays content-only; description is for the modal)
  - `src/components/modals/TaskDetailsDialog.tsx` — add description textarea to the form
  - `src/hooks/useTaskDetails.ts` — add `description` state field

  **Manual test checklist:**
  - [ ] Open AddTaskDialog, enter title + description, save → verify `description` column is populated in DB
  - [ ] Open TaskDetailsDialog, verify description field shows existing value
  - [ ] Edit description in TaskDetailsDialog, save → verify update persists
  - [ ] Quick-add via QuickTaskInput → verify task created (no description, that's fine)
  - [ ] Create task from email (InboxDetailDrawer) → verify `source_inbox_item_id` and description prefill work

  ---

  ### PR2: Add Company Selector to Task Modals

  **Goal:** Allow linking tasks to companies from both AddTaskDialog and TaskDetailsDialog.

  **No schema migration** (columns `company_id` and `pipeline_company_id` already exist).

  **Files to create:**
  - `src/components/modals/task-details/CompanySelector.tsx` — new component: search input + dropdown listing portfolio + pipeline companies. Returns `{ companyId, companyType }`.

  **Files to modify:**
  - `src/hooks/useTaskDetails.ts` — add `companyId`, `companyType`, `companyName` state; populate from task on load
  - `src/components/modals/task-details/TaskDetailsForm.tsx` — add `CompanySelector` below project selector
  - `src/components/modals/AddTaskDialog.tsx` — add `CompanySelector`; populate from prefill if available, allow manual selection otherwise
  - `src/hooks/useTasksManager.tsx` — ensure `handleUpdateTask` passes through `company_id` / `pipeline_company_id`
  - `src/hooks/useTasks.ts` — ensure `transformTaskForDatabase` handles `company_id` / `pipeline_company_id`

  **Manual test checklist:**
  - [ ] Open AddTaskDialog → search for and select a portfolio company → save → verify `company_id` in DB
  - [ ] Open AddTaskDialog → search for and select a pipeline company → save → verify `pipeline_company_id` in DB
  - [ ] Open TaskDetailsDialog for a task with company → verify company shown
  - [ ] Change company in TaskDetailsDialog → save → verify FK updated
  - [ ] Clear company in TaskDetailsDialog → save → verify FK nulled
  - [ ] Go to company detail pane → verify task appears in company tasks tab

  ---

  ### PR3: Aging Logic + Archive Column

  **Goal:** Stop completed tasks from cluttering the default view.

  **Schema migration:**
  ```sql
  ALTER TABLE tasks ADD COLUMN archived_at timestamptz;
  CREATE INDEX idx_tasks_archived ON tasks (created_by, archived_at) WHERE archived_at IS NOT NULL;
  CREATE INDEX idx_tasks_completed_aging ON tasks (created_by, completed_at) WHERE completed_at IS NOT NULL;

  -- Backfill: archive tasks completed more than 30 days ago
  UPDATE tasks SET archived_at = completed_at
  WHERE completed = true AND completed_at < now() - interval '30 days' AND archived_at IS NULL;
  ```

  **Files to modify:**
  - `src/integrations/supabase/types.ts` — add `archived_at` to types
  - `src/hooks/useTasks.ts` — update fetch query to exclude `archived_at IS NOT NULL` and tasks completed > 14 days by default; add parameter to include archived
  - `src/hooks/useTaskFiltering.ts` — add `showArchived` and `showOldCompleted` filter options
  - `src/pages/Tasks.tsx` — add "Show archived" toggle to state and pass to filtering
  - `src/components/tasks/TasksFilters.tsx` — add "Show archived" toggle switch
  - `src/components/modals/TaskDetailsDialog.tsx` — add "Archive" button alongside Delete

  **Manual test checklist:**
  - [ ] Complete a task → verify it remains visible (within 14-day window)
  - [ ] Backfilled tasks completed > 30 days ago → verify `archived_at` is set
  - [ ] Default task list → verify old completed tasks are hidden
  - [ ] Toggle "Show archived" → verify old tasks reappear
  - [ ] Click "Archive" on a task → verify `archived_at` is set and task hides

  ---

  ### PR4: Tasks Page Command Bar + Workspace Layout

  **Goal:** Improve task page density and add company/search filtering.

  **Files to modify:**
  - `src/pages/Tasks.tsx` — restructure layout: two-column (main + Now rail on desktop), merge quick-add and filters into a command bar
  - `src/components/tasks/TasksFilters.tsx` — refactor to horizontal command bar style; add search input and company filter
  - `src/components/tasks/TasksCommandBar.tsx` — **new**: unified bar with search, filters, view toggle, archive toggle
  - `src/components/tasks/NowRail.tsx` — **new**: right sidebar showing overdue tasks, due-soon tasks, quick stats
  - `src/components/tasks/ViewModeToggle.tsx` — integrate into command bar (may remove standalone component)
  - `src/components/tasks/InboxSection.tsx` — rename UI labels from "Inbox" to "Triage", make section collapsible with default state from user preference
  - `src/components/tasks/kanban/InboxColumn.tsx` — rename to "Triage"

  **Manual test checklist:**
  - [ ] Tasks page renders with command bar, main content, and Now rail
  - [ ] Search filters tasks in real-time
  - [ ] Company filter shows matching tasks
  - [ ] All existing filters (status, priority, project, category, sort) still work
  - [ ] Now rail shows overdue and due-soon counts
  - [ ] Triage section collapses/expands
  - [ ] Mobile: Now rail hides, command bar wraps gracefully

  ---

  ### PR5: Task Detail Slide-Over + Activity Stub

  **Goal:** Convert task detail modal to a slide-over panel with richer layout.

  **Files to modify:**
  - `src/components/modals/TaskDetailsDialog.tsx` — convert from `GlassModal` to a slide-over drawer (reuse pattern from `InboxDetailDrawer` or create a `TaskDetailDrawer`)
  - `src/components/modals/task-details/TaskDetailsForm.tsx` — restructure into sections: Properties, Links, Notes, Attachments, Activity
  - `src/components/modals/task-details/TaskLinksSection.tsx` — **new**: shows source email link, company link as clickable chips
  - `src/components/modals/task-details/TaskActivitySection.tsx` — **new**: stub section showing "Created on X" and "Last updated on Y" (full audit trail is Phase 2)

  **Manual test checklist:**
  - [ ] Click task → slide-over panel opens from right
  - [ ] All existing fields (content, description, status, priority, date, project, category, company) editable
  - [ ] Notes section works (add/edit/delete notes)
  - [ ] Attachments section shows for email-sourced tasks
  - [ ] Links section shows source email and company
  - [ ] Activity section shows created/updated timestamps
  - [ ] Ctrl+S saves, Esc closes
  - [ ] Panel doesn't block interaction with main page (optional: click outside to close)

  ---

  ### PR6: Email + Calendar Task Integration

  **Goal:** Show linked tasks in email detail pane; add "Create Follow-Up" to calendar events.

  **Files to modify:**
  - `src/components/dashboard/InboxDetailDrawer.tsx` — add "Linked Tasks" section below "Create Task" button; query tasks by `source_inbox_item_id`
  - `src/hooks/useEmailTasks.ts` — **new**: `useEmailTasks(inboxItemId)` hook fetching tasks linked to an email
  - `src/components/modals/EventDetailsModal.tsx` (or equivalent) — add "Create Follow-Up Task" button that opens `AddTaskDialog` with prefill
  - `src/components/dashboard/InboxDetailDrawer.tsx` — show completion toggles on linked tasks

  **Manual test checklist:**
  - [ ] Open email detail that has linked tasks → see task list
  - [ ] Toggle complete on linked task from email detail → verify status updates
  - [ ] Open calendar event → click "Create Follow-Up Task" → verify dialog opens with correct prefill
  - [ ] Save follow-up task → verify it appears in main tasks list with correct due date

  ---

  ### PR7 (Future): Full Activity Log + Auto-Archive + Importance UX

  **Deferred enhancements:**
  - Full activity log (track status changes, priority changes, due date changes via a `task_activity` table or reuse `snooze_log` pattern)
  - Auto-archive cron job via Supabase Edge Function
  - `importance_rank` column + Eisenhower matrix view
  - Category/company-type filtering in command bar

  These are documented here for roadmap completeness but not part of the initial V2 rollout.

  ---

  ## Summary

  | PR | Scope | Risk | Schema Change |
  |----|-------|------|---------------|
  | PR1 | Fix note persistence + description field | Low | Add column |
  | PR2 | Company selector in task modals | Low | None |
  | PR3 | Aging/archive logic | Low-Med | Add column + backfill |
  | PR4 | Workspace layout + command bar | Medium | None |
  | PR5 | Slide-over detail panel | Medium | None |
  | PR6 | Email/calendar integration | Low | None |
  | PR7 | Activity log + auto-archive (future) | Medium | New table |

  PRs 1-3 are safe, isolated changes that can ship independently. PR4-5 are the larger UX changes. PR6 is additive integration. Each PR is independently mergeable and testable.
