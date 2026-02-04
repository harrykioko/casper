
# Tasks UI Overhaul: Premium Work Surface

## Overview

Transform the Tasks page from an overwhelming backlog view into a **calm, focused, action-oriented work surface** that creates momentum rather than dread. This redesign prioritizes visual hierarchy, inline editing, and session-oriented context while preserving all existing functionality.

---

## Current State Analysis

### Current Architecture
- **Page**: `src/pages/Tasks.tsx` - Two-column layout (280px sidebar + main content)
- **Left Panel**: `TasksSummaryPanel.tsx` - Dense filters, search, view toggles, status/priority chips
- **Main View**: `TasksMainContent.tsx` wraps `TaskList.tsx` - Flat list of uniform task rows
- **Task Cards**: `TaskCardContent.tsx`, `TaskCardMetadata.tsx` - Minimal metadata display
- **Detail**: `TaskDetailsDialog.tsx` - Sheet drawer for deep editing

### Current Issues
- Default view shows "All Items" - overwhelming
- Tasks rendered as thin, uniform rows - no visual hierarchy
- Priority only indicated by checkbox border color - easy to miss
- No effort estimation visible in UI (data exists in DB but not exposed)
- Filters dominate the left panel instead of supporting the work surface
- No session context ("what have I accomplished today?")

---

## Architecture Changes

### Layout Structure (Unchanged)

```text
+------------------+-----------------------------------+
|  Left Panel      |   Main Work Surface               |
|  (280px)         |   (flexible)                      |
|                  |                                   |
|  Filters &       |   Header (session context)        |
|  Navigation      |   Task Input                      |
|  (redesigned)    |   Grouped Task Cards              |
|                  |                                   |
+------------------+-----------------------------------+
```

No new routes. No new modals. Task Detail remains a right-side drawer.

---

## Technical Implementation

### 1. Session-Oriented Page Header

**File**: `src/components/tasks/TasksPageHeader.tsx` (NEW)

Replace the generic card header with a session-oriented banner:

```text
+------------------------------------------------------+
| Your Work                               [+ Add Task] |
| 12 tasks ready · 4 due soon · 3 completed today      |
+------------------------------------------------------+
```

Key elements:
- Title: "Your Work"
- Dynamic subtext computed from task counts
- Primary CTA: "Add Task" (triggers QuickTaskInput focus)
- Optional: Command palette trigger (existing global handler)

### 2. Default View: "Ready to Work"

**File**: `src/hooks/useTaskFiltering.ts`

Add a new computed view that surfaces action-ready tasks:

```typescript
// New "ready" filter mode
if (filters.statusFilter === 'ready') {
  filtered = filtered.filter(task => {
    // Include: high/medium priority, due today/upcoming, not completed, not archived
    const isHighPriority = task.priority === 'high' || task.priority === 'medium';
    const isDueSoon = task.scheduledFor && isWithinWeek(task.scheduledFor);
    const isNotDone = task.status !== 'done' && !task.completed;
    return (isHighPriority || isDueSoon) && isNotDone;
  });
}
```

**File**: `src/pages/Tasks.tsx`

Change default state:
```typescript
const [statusFilter, setStatusFilter] = useState("ready"); // Was "all"
```

### 3. Task Card Redesign

**File**: `src/components/tasks/TaskWorkCard.tsx` (NEW)

Replace flat rows with elevated, hierarchical cards.

**Card Structure**:
```text
+----------------------------------------------------------+
| [Checkbox]  Task title goes here                         |
|             ───────────────────────────────────          |
|             [Company Logo] OatFi                         |
|             ───────────────────────────────────          |
|             Today  ·  P1  ·  15m                [Delete] |
+----------------------------------------------------------+
```

**Visual Hierarchy Rules**:
| Priority | Card Treatment |
|----------|----------------|
| High / Due Today | Stronger contrast, taller padding (py-4), prominent checkbox |
| Medium | Standard card styling (py-3) |
| Low / Later | Muted opacity (0.75), compact padding (py-2) |

**Implementation Details**:
- Checkbox: Large, round button with priority-colored border (existing pattern)
- Context strip: ONE linked entity (company > project > source)
- Metadata row: Due date (relative), Priority badge, Effort chip
- Hover: Subtle elevation + delete button reveal

### 4. Inline Editing Support

**File**: `src/components/tasks/TaskWorkCard.tsx`

Reuse `SuggestionChip` + `Popover` pattern from `InlineTaskForm.tsx`:

```typescript
// Inline editable chips (click to edit via popover)
<InlineEditChip
  label="Due"
  value={formatTaskDate(task.scheduledFor)}
  onEdit={(newDate) => onQuickUpdate(task.id, { scheduledFor: newDate })}
>
  <QuickDatePicks selectedDate={task.scheduledFor} onSelect={handleDateChange} />
</InlineEditChip>

<InlineEditChip
  label="Priority"
  value={task.priority}
  onEdit={(newPriority) => onQuickUpdate(task.id, { priority: newPriority })}
>
  <PriorityOptions value={task.priority} onChange={handlePriorityChange} />
</InlineEditChip>
```

Editable fields (inline):
- Completion (checkbox)
- Due date (popover calendar)
- Priority (popover options)
- Expected effort (popover options)
- Status (popover: To Do / In Progress / Done)

### 5. Expected Effort Integration

**File**: `src/hooks/useTasks.ts`

Extend the Task interface to include effort fields:

```typescript
export interface Task {
  // ... existing fields ...
  effort_minutes?: number | null;
  effort_category?: 'quick' | 'medium' | 'deep' | 'unknown' | null;
}

const transformTask = (row: TaskRow & { project?: any; category?: any }): Task => {
  return {
    // ... existing mappings ...
    effort_minutes: row.effort_minutes || null,
    effort_category: (row.effort_category as 'quick' | 'medium' | 'deep' | 'unknown') || null,
  };
};
```

**File**: `src/components/task-cards/TaskCardEffort.tsx` (NEW)

```typescript
const EFFORT_CONFIG = {
  quick: { label: '5m', color: 'text-emerald-500', icon: Zap },
  medium: { label: '15m', color: 'text-amber-500', icon: Timer },
  deep: { label: '1h+', color: 'text-rose-500', icon: Hourglass },
};
```

### 6. Visual Grouping (Soft Sections)

**File**: `src/components/tasks/TaskGroupedList.tsx` (NEW)

Group tasks into sections without hard filtering:

```typescript
const taskGroups = useMemo(() => {
  const dueSoon = tasks.filter(t => isWithinDays(t.scheduledFor, 2));
  const nextUp = tasks.filter(t => 
    !isWithinDays(t.scheduledFor, 2) && 
    (t.priority === 'high' || t.priority === 'medium')
  );
  const later = tasks.filter(t => 
    !dueSoon.includes(t) && !nextUp.includes(t)
  );
  
  return [
    { label: 'Due Soon', tasks: dueSoon },
    { label: 'Next Up', tasks: nextUp },
    { label: 'Later', tasks: later },
  ].filter(g => g.tasks.length > 0);
}, [tasks]);
```

Section rendering:
- Subtle label header (11px uppercase, muted)
- Sections collapse when empty
- Optional: show completion count per section

### 7. Completion Feedback

**File**: `src/components/tasks/TaskWorkCard.tsx`

Enhance the existing confetti pattern:
- Animate card collapse (Framer Motion `exit` animation)
- Show brief "Done" state before removal
- Update session stats ("3 completed today")

```typescript
<motion.div
  layout
  exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
>
  {/* Card content */}
</motion.div>
```

### 8. Filter Panel Redesign

**File**: `src/components/tasks/TasksSummaryPanel.tsx`

Reduce visual dominance:

**Changes**:
- Remove heavy border from main container
- Use spacing/grouping instead of borders between sections
- Collapse rarely-used filters behind "More filters" toggle:
  - Always visible: Status, Priority
  - Collapsed: Category, Project, Sort
- Lighten chip styling (reduce active state contrast)
- Add "Ready to Work" as primary filter option

**New Panel Structure**:
```text
+-----------------------------+
| [Search input]              |
+-----------------------------+
| VIEW                        |
| [Ready to Work] [All]       |
+-----------------------------+
| STATUS                      |
| To Do · In Progress · Done  |
+-----------------------------+
| PRIORITY                    |
| High · Medium · Low         |
+-----------------------------+
| [More filters...]           |
|   Category: All             |
|   Project: All              |
|   Sort by: Date             |
+-----------------------------+
| VIEW MODE                   |
| [List] [Kanban]             |
+-----------------------------+
```

### 9. Kanban View (De-emphasized)

**File**: `src/components/tasks/TasksKanbanView.tsx`

Minor adjustments:
- Rename columns: "Ready" / "Doing" / "Done Today"
- Reduce card density (increase spacing)
- Apply same `TaskWorkCard` component for consistency

No major changes - Kanban becomes secondary view.

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/tasks/TasksPageHeader.tsx` | CREATE | Session-oriented header with dynamic stats |
| `src/components/tasks/TaskWorkCard.tsx` | CREATE | Premium elevated task card with inline editing |
| `src/components/tasks/TaskGroupedList.tsx` | CREATE | Soft section grouping for task list |
| `src/components/task-cards/TaskCardEffort.tsx` | CREATE | Effort chip component |
| `src/components/tasks/InlineEditChip.tsx` | CREATE | Reusable inline edit pattern |
| `src/hooks/useTasks.ts` | MODIFY | Add effort_minutes, effort_category to Task type |
| `src/hooks/useTaskFiltering.ts` | MODIFY | Add "ready" filter mode |
| `src/pages/Tasks.tsx` | MODIFY | Update default filter, integrate new components |
| `src/components/tasks/TasksSummaryPanel.tsx` | MODIFY | Lighter styling, collapsible filters, Ready view |
| `src/components/tasks/TasksMainContent.tsx` | MODIFY | Use TaskGroupedList instead of flat TaskList |
| `src/components/tasks/TasksKanbanView.tsx` | MODIFY | Rename columns, use TaskWorkCard |

---

## Styling Guidelines

All new components follow Casper's glassmorphic aesthetic:

```typescript
// Card base styling
className={cn(
  "rounded-2xl p-4 transition-all duration-200",
  "bg-white/60 dark:bg-white/[0.04]",
  "border border-white/20 dark:border-white/[0.08]",
  "backdrop-blur-sm",
  "hover:bg-white/80 dark:hover:bg-white/[0.08]",
  "hover:shadow-sm hover:-translate-y-0.5"
)}

// Priority hierarchy
const getPriorityStyles = (priority: string, isOverdue: boolean) => {
  if (isOverdue || priority === 'high') {
    return "py-4 border-l-2 border-l-red-500";
  }
  if (priority === 'medium') {
    return "py-3";
  }
  return "py-2 opacity-75";
};
```

---

## Success Metrics (Post-Implementation)

After implementation, the Tasks page should:
1. Open to a curated "Ready to Work" view, not "All Items"
2. Visually emphasize high-priority and due-soon tasks
3. Allow completing, rescheduling, and re-prioritizing without opening Task Detail
4. Show session progress ("3 completed today")
5. Feel inviting rather than overwhelming, even with 50+ tasks

---

## What Stays the Same

- All existing routes
- Database schema (only reading existing effort_* columns)
- Task Detail drawer (Sheet) for deep editing
- All filter/sort logic (just adding new "ready" mode)
- Kanban view (minor styling updates only)
- Mobile responsive behavior (uses existing `useIsDesktop` patterns)
