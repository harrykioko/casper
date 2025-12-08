# Tasks System Overview

This document provides a comprehensive overview of the Tasks / To-Do system architecture and UX in the Casper application. It serves as a baseline for understanding the current implementation before future iterations.

---

## 1. Overview

The Tasks system in Casper is a multi-context task management solution designed for productivity across different domains:

- **General task management** with list and kanban views
- **Inbox-based triage** for quick task capture and processing
- **Company-linked tasks** for portfolio and pipeline companies
- **Project-specific tasks** within project contexts
- **Dashboard integration** with "Today's Tasks" and priority surfacing

The system supports a workflow pattern: **Capture → Triage (Inbox) → Plan → Execute → Complete**.

### Key Design Principles

1. **Inbox-first capture**: New tasks from the main quick-add go to Inbox by default
2. **Multi-context linking**: Tasks can be linked to projects, portfolio companies, or pipeline companies
3. **Dual view modes**: List view and Kanban board with drag-and-drop
4. **Inline editing**: Quick triage chips for date, project, and priority assignment

---

## 2. Data Model

### 2.1 Tasks Table Schema

**Location**: `src/integrations/supabase/types.ts` (lines 750-839)

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | UUID primary key |
| `content` | `string` | Task description (required) |
| `completed` | `boolean \| null` | Whether task is done |
| `completed_at` | `string \| null` | Timestamp when completed |
| `status` | `string \| null` | Task status: `"todo"`, `"inprogress"`, `"done"` |
| `priority` | `string \| null` | Priority level: `"low"`, `"medium"`, `"high"` |
| `scheduled_for` | `string \| null` | Due date (ISO date string) |
| `project_id` | `string \| null` | FK to `projects` table |
| `company_id` | `string \| null` | FK to `companies` (portfolio) table |
| `pipeline_company_id` | `string \| null` | FK to `pipeline_companies` table |
| `category_id` | `string \| null` | FK to `categories` table |
| `is_quick_task` | `boolean \| null` | **Inbox flag** - indicates task is in inbox |
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
  └── created_by → users.id
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
Separate from tasks - used for email ingestion:
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

### 2.4 Frontend Task Type

**Location**: `src/hooks/useTasks.ts` (lines 10-31)

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
  inbox?: boolean;  // Maps from is_quick_task
}
```

---

## 3. Frontend Architecture

### 3.1 Component Hierarchy

```
src/pages/Tasks.tsx                    # Main Tasks page
├── QuickTaskInput                     # Top quick-add bar
├── ViewModeToggle                     # List/Kanban + Show Inbox switch
├── TasksFilters                       # Filter controls
├── InboxSection                       # Inbox tray (list view)
│   └── InboxSection task rows         # Inline chips + keyboard nav
├── TasksMainContent                   # Regular tasks list
│   └── TaskList                       # Task rows
│       └── TaskCardContent            # Task text
│       └── TaskCardMetadata           # Priority, project, date badges
├── TasksKanbanView                    # Kanban board (kanban view)
│   ├── InboxColumn                    # Inbox as leftmost column
│   └── Workflow columns (Todo, In Progress, Done)
└── TaskDetailsDialog                  # Edit modal
    └── TaskDetailsForm                # Form fields
```

### 3.2 Key Components

#### Tasks Page (`src/pages/Tasks.tsx`)
Main entry point. Manages:
- View mode state (`list` | `kanban`)
- Filter states (status, priority, category, project, sort)
- Selected task for details modal
- Show inbox toggle

#### QuickTaskInput (`src/components/tasks/QuickTaskInput.tsx`)
- Simple text input with "+" button
- Calls `handleAddTask` which creates task with `is_quick_task: true`
- Auto-focuses on mount

#### ViewModeToggle (`src/components/tasks/ViewModeToggle.tsx`)
- Two buttons: List View, Kanban View
- Toggle switch for "Show Inbox"

#### TasksFilters (`src/components/tasks/TasksFilters.tsx`)
Provides filtering by:
- **Category**: Dropdown from `useCategories()`
- **Project**: Dropdown from `useProjects()`
- **Status**: Toggle group (All, To Do, In Progress, Done)
- **Priority**: Toggle group (All, High, Medium, Low)
- **Sort By**: Dropdown (Date, Priority, Project, Status)

#### InboxSection (`src/components/tasks/InboxSection.tsx`)
- Displays tasks where `inbox === true`
- Keyboard navigation (j/k, arrow keys)
- Keyboard shortcuts: `t` = Today, `!` = cycle priority, `Space` = complete, `Enter` = open, `p` = project
- Inline chips for Date, Project, Priority (click to edit)
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
- 4-column layout: Inbox, To Do, In Progress, Done
- Uses `react-beautiful-dnd` for drag-and-drop
- Dragging from Inbox to workflow column = triage
- Dragging between workflow columns = status change
- Cannot drag back to Inbox

#### InboxColumn (`src/components/tasks/kanban/InboxColumn.tsx`)
- Droppable zone for inbox tasks in kanban
- Same card style as workflow columns

#### TaskDetailsDialog (`src/components/modals/TaskDetailsDialog.tsx`)
- Modal for editing task details
- Uses `useTaskDetails` hook for form state
- Fields: content, project, category, date, priority, status
- Keyboard: Esc = close, Cmd/Ctrl+S = save

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
  getInboxTasks: () => Task[];      // Filter inbox=true, not completed
  getNonInboxTasks: () => Task[];   // Filter inbox=false
}
```

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
  handleAddTask: (content) => void;         // Creates with is_quick_task: true
  handleCompleteTask: (id) => void;         // Toggles completed + status
  handleDeleteTask: (id) => void;
  handleUpdateTaskStatus: (id, status) => void;
  handleUpdateTask: (task) => void;         // Full update with transforms
  quickInlineUpdate: (id, patch) => void;   // For inline chips
  bulkUpdate: (ids, patch) => void;         // Multi-select operations
}
```

#### `useTaskDetails` (`src/hooks/useTaskDetails.ts`)
Form state management for task edit modal.

**Returns**:
```typescript
{
  content, setContent,
  status, setStatus,
  scheduledFor, setScheduledFor,
  selectedProject, setSelectedProject,
  priority, setPriority,
  category, setCategory,
  resetForm: () => void,
  createUpdatedTask: () => Task | null
}
```

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
  excludeInbox?: boolean;    // Default: true
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

### 4.3 Supporting Hooks

| Hook | Location | Purpose |
|------|----------|---------|
| `useCategories` | `src/hooks/useCategories.ts` | CRUD for categories, `getCategoryIdByName()` |
| `useProjects` | `src/hooks/useProjects.ts` | CRUD for projects |
| `useInboxItems` | `src/hooks/useInboxItems.ts` | Email inbox items (separate from task inbox) |
| `usePriorityItems` | `src/hooks/usePriorityItems.ts` | Dashboard priority surfacing |

---

## 5. User Flows

### 5.1 Task Creation Origins

| Origin | Component | Default Values |
|--------|-----------|----------------|
| Main quick-add | `QuickTaskInput` | `is_quick_task: true` (→ Inbox) |
| Task details modal | `AddTaskDialog` | Depends on context (prefill) |
| Project view | `ProjectTasksList` | `project_id` set |
| Portfolio company | `CompanyTasksSection` | `company_id` set |
| Pipeline company | `CompanyCommandTasks` | `pipeline_company_id` set |
| From email | `InboxPanel` | Content prefilled from subject |

### 5.2 Inbox Workflow

1. **Capture**: User types in QuickTaskInput → task created with `is_quick_task: true`
2. **Triage**: In InboxSection or Kanban InboxColumn:
   - Set date → moves out of inbox (implicit)
   - Set project → moves out of inbox (implicit)
   - Drag to workflow column (kanban) → `status` changes, leaves inbox
3. **Plan**: Task now in main list, user can:
   - Set priority
   - Assign to project
   - Set due date
4. **Execute**: Work on task, optionally move to "In Progress"
5. **Complete**: Click checkbox or drag to "Done" column

### 5.3 How Tasks Leave Inbox

The `inbox` property (mapped from `is_quick_task`) becomes `false` when:
- User updates `scheduled_for` (date assigned)
- User updates `project_id` (project assigned)
- User updates `status` to anything other than `"todo"`
- In kanban, dragging from Inbox to any workflow column

**Note**: The code comments indicate a DB trigger handles this:
```typescript
// DB trigger will set inbox = false when status !== 'todo'
// DB trigger will handle inbox = false when scheduled_for or project_id is set
```

### 5.4 Navigation Between Views

| From | To | Method |
|------|----|--------|
| Dashboard | Tasks page | Sidebar navigation |
| Tasks list | Task details | Click task row |
| Tasks list | Kanban | ViewModeToggle button |
| Kanban | Task details | Click card |
| Inbox section | Task details | Click row or press Enter |
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
- Inbox tasks are excluded by default from regular views
- Sort is applied after all filters

### 6.5 Kanban Drag-and-Drop

**Library**: `react-beautiful-dnd`

**Allowed moves**:
- Inbox → Todo, In Progress, Done (triggers status update + removes from inbox)
- Todo ↔ In Progress ↔ Done (status update only)

**Disallowed moves**:
- Any column → Inbox (not implemented)

**Toast notifications**:
- "Task triaged" when moving from Inbox
- "Task completed" when moving to Done

---

## 7. Current UX Characteristics

### 7.1 What Works Well

1. **Quick capture**: Fast task entry with auto-focused input
2. **Inbox triage**: Dedicated space for unsorted tasks with keyboard shortcuts
3. **Inline editing**: Chips for date, project, priority without opening modal
4. **Visual feedback**: Confetti animation on completion, drag highlights
5. **Multi-context**: Tasks can exist in multiple contexts (project, company, inbox)
6. **Keyboard navigation**: j/k navigation in inbox, shortcuts for common actions
7. **Bulk operations**: Multi-select in inbox for batch updates

### 7.2 Limitations & Friction Points

1. **Inbox flag coupling**: `is_quick_task` field name is confusing; it's really "in_inbox"
2. **No explicit "remove from inbox"**: Users must set date/project/status to leave inbox
3. **No recurring tasks**: No support for habits or recurring to-dos
4. **Limited overdue visibility**: Date badges don't visually distinguish overdue tasks
5. **No due time**: Only date, no time-of-day scheduling
6. **No subtasks**: Flat task structure only
7. **Email inbox separate**: `inbox_items` table is separate from task inbox concept
8. **Priority system limitations** (from `usePriorityItems.ts` comments):
   - Only shows company-linked tasks on dashboard
   - Standalone tasks invisible in priority view
   - Hard-coded 14-day staleness threshold
   - Limited to 4 items in dashboard
   - No explainability for why items are prioritized
9. **No search**: No task search functionality
10. **Filter state not persisted**: Filters reset on page navigation

### 7.3 Dashboard Integration

The dashboard's "Today's Tasks" section (`TodayTasksSection.tsx`):
- Filters tasks where `scheduled_for` is today
- Category pill filters
- Pinning (local state only, not persisted)
- Inline date/priority editing
- Compact mode for limited space

---

## 8. Appendix

### 8.1 Key File Paths

#### Pages
- `src/pages/Tasks.tsx` - Main tasks page

#### Components
- `src/components/tasks/QuickTaskInput.tsx` - Quick add input
- `src/components/tasks/ViewModeToggle.tsx` - View mode + inbox toggle
- `src/components/tasks/TasksFilters.tsx` - Filter controls
- `src/components/tasks/InboxSection.tsx` - Inbox tray
- `src/components/tasks/TasksMainContent.tsx` - Regular tasks wrapper
- `src/components/tasks/TasksKanbanView.tsx` - Kanban board
- `src/components/tasks/kanban/InboxColumn.tsx` - Kanban inbox column
- `src/components/dashboard/TaskList.tsx` - Task list rows
- `src/components/dashboard/TodayTasksSection.tsx` - Dashboard today's tasks
- `src/components/dashboard/KanbanView.tsx` - Dashboard kanban (no inbox)
- `src/components/modals/TaskDetailsDialog.tsx` - Edit modal
- `src/components/modals/task-details/TaskDetailsForm.tsx` - Edit form
- `src/components/modals/AddTaskDialog.tsx` - Add task modal

#### Task Card Components
- `src/components/task-cards/TaskCardContent.tsx`
- `src/components/task-cards/TaskCardMetadata.tsx`
- `src/components/task-cards/TaskCardPriority.tsx`
- `src/components/task-cards/TaskCardProject.tsx`
- `src/components/task-cards/TaskCardDate.tsx`

#### Hooks
- `src/hooks/useTasks.ts` - Core task CRUD
- `src/hooks/useTasksManager.tsx` - High-level task operations
- `src/hooks/useTaskDetails.ts` - Task edit form state
- `src/hooks/useTaskFiltering.ts` - Filter/sort logic
- `src/hooks/useCompanyTasks.ts` - Portfolio company tasks
- `src/hooks/usePipelineTasks.ts` - Pipeline company tasks
- `src/hooks/useCategories.ts` - Category management
- `src/hooks/usePriorityItems.ts` - Dashboard priority items

#### Types
- `src/integrations/supabase/types.ts` - Supabase schema types
- `src/types/inbox.ts` - InboxItem and TaskPrefillOptions

#### Utilities
- `src/utils/dateUtils.ts` - Date formatting and overdue detection

### 8.2 Transform Functions

**DB Row → Frontend Task** (`useTasks.ts:34-53`):
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
  // ... timestamps and IDs
});
```

**Frontend → DB Format** (`useTasks.ts:56-81`):
```typescript
const transformTaskForDatabase = (taskData) => {
  // scheduledFor → scheduled_for
  // projectId → project_id
  // inbox → is_quick_task
  // categoryId → category_id
  // Remove frontend-only fields (category name)
};
```

### 8.3 Status Update Flow

```
User action (checkbox click / drag)
    │
    ▼
handleCompleteTask() or handleUpdateTaskStatus()
    │
    ▼
updateTask(id, { completed, status })
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

### 8.4 Inbox Detection Logic

```typescript
// In useTasks.ts
getInboxTasks() {
  return tasks
    .filter(task => task.inbox === true && !task.completed)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

getNonInboxTasks() {
  return tasks.filter(task => !task.inbox);
}
```

---

*Document generated: December 2024*
*Covers codebase as of commit `a0bf44f` (priority system: priorityMapping.ts)*
