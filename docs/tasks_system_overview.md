# Tasks System Overview

This document provides a comprehensive overview of the Tasks / To-Do system architecture and UX in the Casper application. It serves as a baseline for understanding the current implementation before future iterations.

---

## 1. Overview

The Tasks system in Casper is a multi-context task management solution designed for productivity across different domains:

- **General task management** with list and kanban views
- **Inbox-based triage** for quick task capture and processing (labelled "Triage" in the UI)
- **Company-linked tasks** for portfolio and pipeline companies
- **Project-specific tasks** within project contexts
- **Dashboard integration** with "Today's Tasks" and priority surfacing
- **Archive support** with automatic aging of completed tasks

The system supports a workflow pattern: **Capture → Triage → Plan → Execute → Complete → Archive**.

### Key Design Principles

1. **Inbox-first capture**: New tasks from the main quick-add go to Triage by default
2. **Multi-context linking**: Tasks can be linked to projects, portfolio companies, or pipeline companies
3. **Dual view modes**: List view and Kanban board with drag-and-drop
4. **Inline editing**: Quick triage chips for date, project, and priority assignment
5. **Workspace layout**: Two-column grid with a summary/command panel and main content area
6. **Archive lifecycle**: Completed tasks auto-archive after 14 days; manual archive/unarchive supported

---

## 2. Data Model

### 2.1 Tasks Table Schema

**Location**: `src/integrations/supabase/types.ts`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | UUID primary key |
| `content` | `string` | Task title/description (required) |
| `completed` | `boolean \| null` | Whether task is done |
| `completed_at` | `string \| null` | Timestamp when completed |
| `status` | `string \| null` | Task status: `"todo"`, `"inprogress"`, `"done"` |
| `priority` | `string \| null` | Priority level: `"low"`, `"medium"`, `"high"` |
| `scheduled_for` | `string \| null` | Due date (ISO date string) |
| `project_id` | `string \| null` | FK to `projects` table |
| `company_id` | `string \| null` | FK to `companies` (portfolio) table |
| `pipeline_company_id` | `string \| null` | FK to `pipeline_companies` table |
| `category_id` | `string \| null` | FK to `categories` table |
| `is_quick_task` | `boolean \| null` | **Triage flag** — indicates task is in triage inbox |
| `is_top_priority` | `boolean` | Top-priority pin flag |
| `source_inbox_item_id` | `string \| null` | FK to `inbox_items` — email origin |
| `snoozed_until` | `string \| null` | Snooze target timestamp |
| `snooze_count` | `integer` | Times snoozed |
| `last_snoozed_at` | `string \| null` | Last snooze timestamp |
| `effort_minutes` | `integer` | Effort estimate |
| `effort_category` | `string` | `"quick"` / `"medium"` / `"deep"` / `"unknown"` |
| `archived_at` | `string \| null` | When task was archived; null = not archived |
| `created_by` | `string \| null` | FK to `users` table |
| `created_at` | `string` | Creation timestamp |
| `updated_at` | `string` | Last update timestamp |

### 2.2 Relationships

```
tasks
  ├── project_id → projects.id (optional)
  ├── company_id → companies.id (portfolio, optional)
  ├── pipeline_company_id → pipeline_companies.id (optional)
  ├── category_id → categories.id (optional)
  ├── source_inbox_item_id → inbox_items.id (email origin, optional)
  ├── created_by → users.id
  │
  └── (via note_links.target_id where target_type='task')
      └── note_links → project_notes (threaded notes/comments)
```

### 2.3 Related Tables

#### Categories Table
| Field | Type |
|-------|------|
| `id` | `string` |
| `name` | `string` |
| `created_by` | `string \| null` |
| `created_at` | `string \| null` |

#### Projects Table
| Field | Type |
|-------|------|
| `id` | `string` |
| `name` | `string` |
| `color` | `string \| null` |
| `context` | `string \| null` |
| `description` | `string \| null` |
| `created_by` | `string \| null` |

#### Inbox Items Table (Email-based)
Separate from tasks — used for email ingestion:
| Field | Type |
|-------|------|
| `id` | `string` |
| `subject` | `string` |
| `from_email` | `string` |
| `from_name` | `string \| null` |
| `snippet` | `string \| null` |
| `is_read` | `boolean` |
| `is_resolved` | `boolean` |
| `is_deleted` | `boolean` |
| `snoozed_until` | `string \| null` |
| `related_company_id` | `string \| null` |

#### Notes System (Polymorphic)
- `project_notes` — Note content storage
- `note_links` — Links notes to entities via `target_type` + `target_id` (where `target_type = 'task'` for task notes)

### 2.4 Frontend Task Type

**Location**: `src/hooks/useTasks.ts`

```typescript
interface Task {
  id: string;
  content: string;
  completed: boolean;
  project?: { id: string; name: string; color: string; };
  priority?: "low" | "medium" | "high";
  category?: string;
  scheduledFor?: string;
  status?: "todo" | "inprogress" | "done";
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  project_id?: string;
  category_id?: string;
  company_id?: string;
  pipeline_company_id?: string;
  inbox?: boolean;              // Maps from is_quick_task
  snoozed_until?: string | null;
  is_top_priority?: boolean;
  source_inbox_item_id?: string | null;
  archived_at?: string | null;
  completed_at?: string | null;
}
```

---

## 3. Frontend Architecture

### 3.1 Component Hierarchy

```
src/pages/Tasks.tsx                    # Main Tasks page (workspace layout)
├── TasksSummaryPanel                  # Left sidebar: search, filters, view controls, stats
│   ├── Search input
│   ├── Status stat chips (All, To Do, In Progress, Done, Archived)
│   ├── Priority stat chips (High, Medium, Low)
│   ├── Filter dropdowns (Category, Project, Sort)
│   ├── View mode toggle (List / Kanban)
│   ├── Show Triage toggle
│   └── Show Archived toggle
├── QuickTaskInput                     # Top quick-add bar
├── InboxSection                       # Triage section (list view, toggled)
│   └── Inline chips + keyboard nav + bulk actions
├── TasksMainContent                   # Regular tasks list
│   └── TaskList                       # Task rows
│       └── TaskCardContent            # Task text
│       └── TaskCardMetadata           # Priority, project, date badges
├── TasksKanbanView                    # Kanban board (kanban view)
│   ├── Triage column (was "Inbox")
│   └── Workflow columns (Todo, In Progress, Done)
└── TaskDetailsDialog                  # Slide-over detail panel (Sheet)
    ├── TaskDetailsForm                # Properties: content, status, date, project, priority, category, company
    ├── TaskLinksSection               # Source email link, company links
    ├── TaskNotesSection               # Threaded notes
    ├── TaskAttachmentsSection         # Email attachments
    └── TaskActivitySection            # Created/updated timestamps
```

### 3.2 Key Components

#### Tasks Page (`src/pages/Tasks.tsx`)
Main entry point. Uses a **2-column grid layout**:
- **Left column (desktop)**: `TasksSummaryPanel` — sticky sidebar with search, filters, stats, view controls
- **Right column**: Quick-add input + main content (list or kanban)

Manages:
- View mode state (`list` | `kanban`)
- Filter states (status, priority, category, project, sort, search)
- Selected task for details slide-over
- Show triage toggle
- Show archived toggle
- Mobile-responsive: filters collapse into a toggle-able panel

#### TasksSummaryPanel (`src/components/tasks/TasksSummaryPanel.tsx`)
Desktop-only left sidebar with:
- **Search input**: Filters tasks by content text
- **Status stat chips**: Clickable counts for All, To Do, In Progress, Done, Archived
- **Priority stat chips**: Clickable counts for High, Medium, Low
- **Filter dropdowns**: Category, Project, Sort By
- **View toggle**: List / Kanban buttons
- **Show Triage**: Toggle switch with count badge
- **Show Archived**: Toggle switch with count badge

#### QuickTaskInput (`src/components/tasks/QuickTaskInput.tsx`)
- Simple text input with "+" button
- Creates task with `is_quick_task: true` (goes to Triage)
- Auto-focuses on mount

#### InboxSection (`src/components/tasks/InboxSection.tsx`)
- Displays tasks where `inbox === true` (labelled "Triage" in UI)
- Keyboard navigation (j/k, arrow keys)
- Keyboard shortcuts: `t` = Today, `!` = cycle priority, `Space` = complete, `Enter` = open, `p` = project, `Shift+Space` = multi-select
- Inline chips for Date, Project, Priority (click to edit)
- **Promote button** to explicitly move task out of triage
- Multi-select with Shift+click for bulk actions
- Bulk actions: Schedule Today, Set Project, Set Priority, Complete

#### TasksMainContent (`src/components/tasks/TasksMainContent.tsx`)
- Wraps `TaskList` in a card
- Shows "No tasks yet" empty state

#### TaskList (`src/components/dashboard/TaskList.tsx`)
- Renders task rows with completion button, content, metadata
- Priority-colored border on completion button
- Delete button on hover
- Confetti animation on completion

#### TasksKanbanView (`src/components/tasks/TasksKanbanView.tsx`)
- 4-column layout: **Triage**, To Do, In Progress, Done
- Uses `react-beautiful-dnd` for drag-and-drop
- Dragging from Triage to workflow column = promotes task
- Dragging between workflow columns = status change
- Cannot drag back to Triage

#### TaskDetailsDialog (`src/components/modals/TaskDetailsDialog.tsx`)
- **Sheet-based slide-over panel** (right side, not centered modal)
- Width: 480px (sm) / 520px (lg)
- Header with "Task Detail" title and **Float button** (opens floating note via `FloatingNoteContext`)
- **Sections**: Properties, Links, Notes, Attachments, Activity
- **Footer actions**: Delete, Archive/Unarchive, Cancel, Save Changes
- Keyboard: Esc = close, Ctrl/Cmd+S = save
- Supports archive and unarchive via `onArchiveTask` / `onUnarchiveTask` callbacks

#### Task Details Form Components

Located in `src/components/modals/task-details/`:

| Component | Purpose |
|-----------|---------|
| `TaskDetailsForm.tsx` | Main form layout with all field selectors |
| `TaskContentInput.tsx` | Content/title input |
| `ProjectSelector.tsx` | Project dropdown selector |
| `CompanySelector.tsx` | **Unified company search** — portfolio + pipeline companies |
| `CategorySelector.tsx` | Category dropdown |
| `DateSelector.tsx` | Due date picker |
| `PrioritySelector.tsx` | Priority toggle group |
| `StatusSelector.tsx` | Status toggle group |
| `TaskLinksSection.tsx` | Shows source email and company links |
| `TaskActivitySection.tsx` | Shows created/updated timestamps |

### 3.3 Task Card Components

Located in `src/components/task-cards/`:

| Component | Purpose |
|-----------|---------|
| `TaskCardContent.tsx` | Renders task text, strikethrough if completed |
| `TaskCardMetadata.tsx` | Container for priority, project, date badges |
| `TaskCardPriority.tsx` | Priority badge with color coding |
| `TaskCardProject.tsx` | Project badge with color dot |
| `TaskCardDate.tsx` | Due date badge with calendar icon |

---

## 4. Hooks and State Management

### 4.1 Core Hooks

#### `useTasks` (`src/hooks/useTasks.ts`)
Primary hook for task CRUD operations.

**Returns**:
```typescript
{
  tasks: Task[];              // All tasks
  loading: boolean;
  error: string | null;
  createTask: (data) => Promise<Task>;
  updateTask: (id, updates) => Promise<Task>;
  deleteTask: (id) => Promise<void>;
  snoozeTask: (id, until: Date) => Promise<Task>;
  markTaskTopPriority: (id, isTop: boolean) => Promise<Task>;
  getInboxTasks: () => Task[];        // Filter inbox=true, not completed
  getNonInboxTasks: () => Task[];     // Filter inbox=false, not archived
  getArchivedTasks: () => Task[];     // Filter non-inbox, archived
  archiveTask: (id) => Promise<Task>;
  unarchiveTask: (id) => Promise<Task>;
}
```

**Archive logic** (client-side): A task is considered archived if:
- `archived_at` is set, OR
- `completed === true` AND `completed_at` is older than 14 days

**Data Flow**:
1. Fetches with Supabase join: tasks + projects + categories
2. Orders by `created_at DESC`
3. Transforms DB rows to frontend Task type via `transformTask()`

#### `useTasksManager` (`src/hooks/useTasksManager.tsx`)
High-level wrapper around `useTasks` for UI operations.

**Returns**:
```typescript
{
  tasks: Task[];
  inboxTasks: Task[];          // getInboxTasks()
  nonInboxTasks: Task[];       // getNonInboxTasks()
  archivedTasks: Task[];       // getArchivedTasks()
  handleAddTask: (content) => void;           // Creates with is_quick_task: true
  handleCompleteTask: (id) => void;           // Toggles completed + status
  handleDeleteTask: (id) => void;
  handlePromoteTask: (id) => void;            // Sets is_quick_task = false
  handleUpdateTaskStatus: (id, status) => void;
  handleUpdateTask: (task) => void;           // Full update with company link support
  quickInlineUpdate: (id, patch) => void;     // For inline chips
  bulkUpdate: (ids, patch) => void;           // Multi-select operations
  handleArchiveTask: (id) => void;
  handleUnarchiveTask: (id) => void;
}
```

#### `useTaskDetails` (`src/hooks/useTaskDetails.ts`)
Form state management for task edit panel.

**Returns**:
```typescript
{
  content, setContent,
  status, setStatus,
  scheduledFor, setScheduledFor,
  selectedProject, setSelectedProject,
  priority, setPriority,
  category, setCategory,
  companyLink, setCompanyLink,       // TaskCompanyLink (portfolio or pipeline)
  resetForm: () => void,
  createUpdatedTask: () => Task | null
}
```

Uses `TaskCompanyLink` type from `@/lib/taskCompanyLink` to handle unified company selection across portfolio and pipeline companies.

#### `useTaskFiltering` (`src/hooks/useTaskFiltering.ts`)
Filtering and sorting logic.

**Parameters**:
```typescript
{
  statusFilter: string;      // "all" | "todo" | "progress" | "done"
  priorityFilter: string;    // "all" | "high" | "medium" | "low"
  categoryFilter: string;    // "all" | category name
  projectFilter: string;     // "all" | project name
  sortBy: string;            // "date" | "priority" | "project" | "status"
}
```

**Sort Orders**:
- `date`: `created_at DESC` (newest first)
- `priority`: high (3) > medium (2) > low (1) > none (0)
- `project`: alphabetical by project name
- `status`: todo (1) < inprogress (2) < done (3)

### 4.2 Context-Specific Hooks

#### `useCompanyTasks` (`src/hooks/useCompanyTasks.ts`)
For portfolio company tasks (filtered by `company_id`).
- Real-time subscription via Supabase channel
- Returns `openTasks`, `completedTasks`

#### `usePipelineTasks` (`src/hooks/usePipelineTasks.ts`)
For pipeline company tasks (filtered by `pipeline_company_id`).
- Real-time subscription via Supabase channel
- Returns `openTasks`, `completedTasks`

#### `useProjectTasks` (`src/hooks/useProjectTasks.ts`)
For project-scoped tasks (filtered by `project_id`).
- Simple create/fetch operations

#### `usePipelineTasksAggregate` (`src/hooks/usePipelineTasksAggregate.ts`)
Performance optimization for pipeline views.
- Bulk fetch for multiple company IDs
- Returns Map for O(1) lookups
- Stale time: 30 seconds

### 4.3 Supporting Hooks

| Hook | Location | Purpose |
|------|----------|---------|
| `useCategories` | `src/hooks/useCategories.ts` | CRUD for categories, `getCategoryIdByName()` |
| `useProjects` | `src/hooks/useProjects.ts` | CRUD for projects |
| `useInboxItems` | `src/hooks/useInboxItems.ts` | Email inbox items (separate from task triage) |
| `usePriorityItems` | `src/hooks/usePriorityItems.ts` | Dashboard priority surfacing |
| `useTaskAttachments` | `src/hooks/useTaskAttachments.ts` | Email attachments via `source_inbox_item_id` |
| `useNotes` | `src/hooks/useNotes.ts` | Polymorphic notes: `useNotesForTarget`, CRUD |

---

## 5. User Flows

### 5.1 Task Creation Origins

| Origin | Component | Default Values |
|--------|-----------|----------------|
| Main quick-add | `QuickTaskInput` | `is_quick_task: true` (→ Triage) |
| Task details modal | `AddTaskDialog` | Depends on context (prefill) |
| Project view | `ProjectTasksList` | `project_id` set |
| Portfolio company | `CompanyCommandTasks` | `company_id` set |
| Pipeline company | `CompanyCommandTasks` | `pipeline_company_id` set |
| From email | `InboxDetailDrawer` | Content prefilled from subject |
| From Focus Queue | `WorkItemReviewCard` | Content + priority from suggestion |

### 5.2 Triage Workflow

1. **Capture**: User types in QuickTaskInput → task created with `is_quick_task: true`
2. **Triage**: In InboxSection or Kanban Triage column:
   - Set date → moves out of triage (implicit via DB trigger)
   - Set project → moves out of triage (implicit via DB trigger)
   - Click **Promote** button → explicitly sets `is_quick_task = false`
   - Drag to workflow column (kanban) → `status` changes, leaves triage
3. **Plan**: Task now in main list, user can:
   - Set priority
   - Assign to project
   - Link to company
   - Set due date
4. **Execute**: Work on task, optionally move to "In Progress"
5. **Complete**: Click checkbox or drag to "Done" column
6. **Archive**: Auto-archived after 14 days, or manually archived from detail panel

### 5.3 How Tasks Leave Triage

The `inbox` property (mapped from `is_quick_task`) becomes `false` when:
- User clicks the **Promote** button (`handlePromoteTask`)
- User updates `scheduled_for` (date assigned — via DB trigger)
- User updates `project_id` (project assigned — via DB trigger)
- User updates `status` to anything other than `"todo"` (via DB trigger)
- In kanban, dragging from Triage to any workflow column

### 5.4 Archive Lifecycle

Tasks are considered archived when:
- `archived_at` is explicitly set (manual archive), OR
- `completed === true` AND `completed_at` is older than 14 days (auto-archive)

Users can:
- View archived tasks by toggling "Show Archived" in the summary panel
- Manually archive a task from the detail panel footer
- Unarchive a task to restore it to the active list

### 5.5 Navigation Between Views

| From | To | Method |
|------|----|--------|
| Dashboard | Tasks page | Sidebar navigation |
| Tasks list | Task details | Click task row → slide-over panel |
| Tasks list | Kanban | View toggle in summary panel |
| Kanban | Task details | Click card → slide-over panel |
| Triage section | Task details | Click row or press Enter |
| Project view | Task details | Click task |
| Company view | Task details | Click task |

---

## 6. Behavior & Logic

### 6.1 Status Lifecycle

```
┌─────────┐     drag/update     ┌─────────────┐     drag/update     ┌──────┐
│  todo   │ ────────────────► │ inprogress  │ ────────────────► │ done │
└─────────┘                     └─────────────┘                     └──────┘
     ▲                                                                   │
     │                        (can revert)                               │
     └───────────────────────────────────────────────────────────────────┘
```

- **Default status**: `"todo"` (or `null` treated as `"todo"`)
- **Completion**: Setting `status: "done"` also sets `completed: true`
- **Uncompleting**: Setting `completed: false` also sets `status: "todo"`

### 6.2 Priority Levels

| Level | Value | UI Color | Sort Weight |
|-------|-------|----------|-------------|
| High | `"high"` | Red (`#ef4444`) | 3 |
| Medium | `"medium"` | Orange (`#f97316`) | 2 |
| Low | `"low"` | Gray (`#9ca3af`) | 1 |
| None | `null` | Muted | 0 |

**Priority Cycling** (keyboard `!` or click):
`low → medium → high → low`

### 6.3 Date Handling

**Utility**: `src/utils/dateUtils.ts`

| Date | Display |
|------|---------|
| Today | "Today" |
| Tomorrow | "Tomorrow" |
| Yesterday | "Yesterday" |
| Within 7 days | Day name ("Mon", "Tue", etc.) |
| Other | "MMM d" format ("Dec 15") |

**Overdue Detection**:
```typescript
isOverdue(dateString) = isPast(date) && !isToday(date)
```

### 6.4 Sorting Rules

**Default sort**: `created_at DESC` (newest first)

**In useTaskFiltering**:
- Triage tasks are excluded by default from regular views
- Archived tasks are excluded by default (toggled separately)
- Sort is applied after all filters

### 6.5 Kanban Drag-and-Drop

**Library**: `react-beautiful-dnd`

**Allowed moves**:
- Triage → Todo, In Progress, Done (triggers status update + promotes from triage)
- Todo ↔ In Progress ↔ Done (status update only)

**Disallowed moves**:
- Any column → Triage (not implemented)

**Toast notifications**:
- "Task triaged" when moving from Triage
- "Task completed" when moving to Done

---

## 7. Focus Queue (Separate System)

The Focus Queue is a **separate work-item triage system** distinct from the tasks inbox. It provides a unified review queue for incoming items across multiple sources.

### 7.1 Data Model

**Tables** (migration: `20260130100000_focus_queue_tables.sql`):

- `work_items` — Unified review queue entries
  - `source_type`: `'email'` | `'calendar_event'` | `'task'` | `'note'` | `'reading'`
  - `status`: `'needs_review'` | `'enriched_pending'` | `'trusted'` | `'snoozed'` | `'ignored'`
  - `reason_codes`: text array of review reasons
  - `priority`: integer ranking
- `entity_links` — Links work items to companies/projects
  - `target_type`: `'company'` | `'project'`
  - `confidence`: numeric confidence score
- `item_extracts` — AI-generated summaries and suggestions
  - `extract_type`: `'summary'` | `'highlights'` | `'decisions'` | `'followups'` | `'key_entities'` | `'tasks_suggested'`

### 7.2 Focus Queue Page (`src/pages/FocusQueue.tsx`)
- 3-column layout: Filters | Queue List + Review Card | Context Rail
- Actions: Link entity, Create task from suggestion, Save as note, Snooze, Ignore, Mark trusted
- Backfills work items from existing source records on first load

### 7.3 Hooks
| Hook | Purpose |
|------|---------|
| `useWorkQueue` | Fetch and filter work items |
| `useWorkItemDetail` | Detailed info for selected work item |
| `useWorkItemActions` | Actions: link, create task, save note, snooze, ignore, trust |
| `useBackfillWorkItems` | Backfill work_items from existing records |
| `useEnsureWorkItem` | Ensure a work item exists for a source |

### 7.4 Components (`src/components/focus/`)
| Component | Purpose |
|-----------|---------|
| `FocusFiltersPanel.tsx` | Filter sidebar with status, reason, source type |
| `WorkQueueList.tsx` | List of work items with icons |
| `WorkItemReviewCard.tsx` | Detail card with actions, task suggestions |
| `WorkItemContextRail.tsx` | Context panel with entity links, extracts, related items |
| `TaskSuggestionEditor.tsx` | Edit suggested task content/priority before creation |

---

## 8. Current UX Characteristics

### 8.1 What Works Well

1. **Workspace layout**: 2-column grid with sticky summary panel and search
2. **Quick capture**: Fast task entry with auto-focused input
3. **Triage workflow**: Dedicated space for unsorted tasks with keyboard shortcuts and promote button
4. **Inline editing**: Chips for date, project, priority without opening detail panel
5. **Slide-over detail panel**: Sheet-based panel with sections for properties, links, notes, attachments, activity
6. **Company linking**: Unified company selector supporting both portfolio and pipeline companies
7. **Visual feedback**: Confetti animation on completion, drag highlights
8. **Multi-context**: Tasks can exist in multiple contexts (project, company, inbox, focus queue)
9. **Keyboard navigation**: j/k navigation in triage, shortcuts for common actions
10. **Bulk operations**: Multi-select in triage for batch updates
11. **Archive lifecycle**: Automatic aging + manual archive/unarchive
12. **Floating notes**: "Float" button opens a floating note editor linked to the task
13. **Notes & attachments**: Threaded notes section and email attachment display in detail panel

### 8.2 Limitations & Friction Points

1. **Inbox flag coupling**: `is_quick_task` field name is confusing; it's really "in_triage"
2. **No `description` column**: Tasks only have `content` — no separate description field for longer notes (workaround: use the notes system)
3. **No recurring tasks**: No support for habits or recurring to-dos
4. **Limited overdue visibility**: Date badges don't visually distinguish overdue tasks
5. **No due time**: Only date, no time-of-day scheduling
6. **No subtasks**: Flat task structure only
7. **Email inbox separate**: `inbox_items` table is separate from task triage concept
8. **No search in mobile**: Search is in the summary panel which is desktop-only
9. **No company filter in filters**: Company filtering not yet available in the task filters
10. **Filter state not persisted**: Filters reset on page navigation
11. **`completed` boolean redundant**: Synced with `status = 'done'` but adds complexity

### 8.3 Dashboard Integration

The dashboard's "Today's Tasks" section (`TodayTasksSection.tsx`):
- Filters tasks where `scheduled_for` is today
- Category pill filters
- Pinning (local state only, not persisted)
- Inline date/priority editing
- Compact mode for limited space

---

## 9. Appendix

### 9.1 Key File Paths

#### Pages
- `src/pages/Tasks.tsx` — Main tasks page
- `src/pages/FocusQueue.tsx` — Focus Queue page

#### Components
- `src/components/tasks/QuickTaskInput.tsx` — Quick add input
- `src/components/tasks/TasksSummaryPanel.tsx` — Left sidebar with search, filters, stats, view controls
- `src/components/tasks/TasksFilters.tsx` — Filter controls (mobile)
- `src/components/tasks/InboxSection.tsx` — Triage inbox section
- `src/components/tasks/TasksMainContent.tsx` — Regular tasks wrapper
- `src/components/tasks/TasksKanbanView.tsx` — Kanban board
- `src/components/tasks/kanban/InboxColumn.tsx` — Kanban triage column
- `src/components/tasks/TaskAttachmentsSection.tsx` — Email attachments display
- `src/components/dashboard/TaskList.tsx` — Task list rows
- `src/components/dashboard/TodayTasksSection.tsx` — Dashboard today's tasks
- `src/components/dashboard/KanbanView.tsx` — Dashboard kanban (no inbox)
- `src/components/modals/TaskDetailsDialog.tsx` — Slide-over detail panel
- `src/components/modals/task-details/TaskDetailsForm.tsx` — Edit form
- `src/components/modals/task-details/TaskContentInput.tsx` — Title input
- `src/components/modals/task-details/CompanySelector.tsx` — Unified company selector
- `src/components/modals/task-details/ProjectSelector.tsx` — Project selector
- `src/components/modals/task-details/CategorySelector.tsx` — Category selector
- `src/components/modals/task-details/DateSelector.tsx` — Date picker
- `src/components/modals/task-details/PrioritySelector.tsx` — Priority selector
- `src/components/modals/task-details/StatusSelector.tsx` — Status selector
- `src/components/modals/task-details/TaskLinksSection.tsx` — Links section
- `src/components/modals/task-details/TaskActivitySection.tsx` — Activity section
- `src/components/modals/AddTaskDialog.tsx` — Add task modal
- `src/components/notes/TaskNotesSection.tsx` — Notes section in detail panel
- `src/components/command-pane/CompanyCommandTasks.tsx` — Tasks tab in company detail pane

#### Focus Queue Components
- `src/components/focus/FocusFiltersPanel.tsx` — Filter sidebar
- `src/components/focus/WorkQueueList.tsx` — Work item list
- `src/components/focus/WorkItemReviewCard.tsx` — Review card with actions
- `src/components/focus/WorkItemContextRail.tsx` — Context rail
- `src/components/focus/TaskSuggestionEditor.tsx` — Task suggestion editor

#### Task Card Components
- `src/components/task-cards/TaskCardContent.tsx`
- `src/components/task-cards/TaskCardMetadata.tsx`
- `src/components/task-cards/TaskCardPriority.tsx`
- `src/components/task-cards/TaskCardProject.tsx`
- `src/components/task-cards/TaskCardDate.tsx`

#### Hooks
- `src/hooks/useTasks.ts` — Core task CRUD + archive
- `src/hooks/useTasksManager.tsx` — High-level task operations + promote + archive
- `src/hooks/useTaskDetails.ts` — Task edit form state + company link
- `src/hooks/useTaskFiltering.ts` — Filter/sort logic
- `src/hooks/useCompanyTasks.ts` — Portfolio company tasks
- `src/hooks/usePipelineTasks.ts` — Pipeline company tasks
- `src/hooks/useProjectTasks.ts` — Project-scoped tasks
- `src/hooks/usePipelineTasksAggregate.ts` — Multi-company task aggregation
- `src/hooks/useTaskAttachments.ts` — Email attachments for tasks
- `src/hooks/useCategories.ts` — Category management
- `src/hooks/useProjects.ts` — Project management
- `src/hooks/usePriorityItems.ts` — Dashboard priority items
- `src/hooks/useNotes.ts` — Polymorphic notes system
- `src/hooks/useWorkQueue.ts` — Focus Queue work items
- `src/hooks/useWorkItemDetail.ts` — Work item detail
- `src/hooks/useWorkItemActions.ts` — Work item actions
- `src/hooks/useBackfillWorkItems.ts` — Work item backfill
- `src/hooks/useEnsureWorkItem.ts` — Ensure work item exists

#### Types & Utilities
- `src/integrations/supabase/types.ts` — Supabase schema types
- `src/types/inbox.ts` — InboxItem and TaskPrefillOptions
- `src/lib/taskCompanyLink.ts` — Company link utilities (get/set TaskCompanyLink)
- `src/utils/dateUtils.ts` — Date formatting and overdue detection
- `src/contexts/FloatingNoteContext.tsx` — Floating note context provider

#### Migrations
- `supabase/migrations/20260129300000_pr3_archive_column.sql` — `archived_at` column + indexes + backfill
- `supabase/migrations/20260130100000_focus_queue_tables.sql` — `work_items`, `entity_links`, `item_extracts`

### 9.2 Transform Functions

**DB Row → Frontend Task** (`useTasks.ts`):
```typescript
const transformTask = (row) => ({
  id: row.id,
  content: row.content,
  completed: row.completed || false,
  project: row.project,
  priority: row.priority,
  category: row.category?.name,
  scheduledFor: row.scheduled_for,
  status: row.status || "todo",
  inbox: row.is_quick_task || false,
  snoozed_until: row.snoozed_until || null,
  is_top_priority: row.is_top_priority || false,
  source_inbox_item_id: row.source_inbox_item_id || null,
  archived_at: row.archived_at || null,
  completed_at: row.completed_at || null,
  // ... timestamps and IDs
});
```

**Frontend → DB Format** (`useTasks.ts`):
```typescript
const transformTaskForDatabase = (taskData) => {
  // scheduledFor → scheduled_for
  // projectId → project_id
  // inbox → is_quick_task
  // categoryId → category_id
  // Remove frontend-only fields (category name)
};
```

### 9.3 Status Update Flow

```
User action (checkbox click / drag / promote)
    │
    ▼
handleCompleteTask() / handleUpdateTaskStatus() / handlePromoteTask()
    │
    ▼
updateTask(id, { completed, status, is_quick_task })
    │
    ▼
transformTaskForDatabase() - convert field names
    │
    ▼
supabase.from('tasks').update()
    │
    ▼
[DB Trigger: if status !== 'todo', set is_quick_task = false]
    │
    ▼
setTasks() - update local state
```

### 9.4 Archive Detection Logic

```typescript
// In useTasks.ts
const isTaskArchived = (task: Task): boolean => {
  if (task.archived_at) return true;            // Explicitly archived
  if (task.completed && task.completed_at) {
    const completedDate = new Date(task.completed_at);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    return completedDate < fourteenDaysAgo;      // Auto-archived after 14 days
  }
  return false;
};

getNonInboxTasks() {
  return tasks.filter(task => !task.inbox && !isTaskArchived(task));
}

getArchivedTasks() {
  return tasks.filter(task => !task.inbox && isTaskArchived(task));
}
```

### 9.5 Triage Detection Logic

```typescript
// In useTasks.ts
getInboxTasks() {
  return tasks
    .filter(task => task.inbox === true && !task.completed)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
```

---

*Document updated: January 2026*
*Covers codebase as of commit `784e2ae` (focus queue hooks update)*
