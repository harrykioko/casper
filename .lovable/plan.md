

# Tasks UI Overhaul v2: Premium Work Surface

## Problem Summary

The first pass implemented visual changes but failed to fundamentally change the mental model. The Tasks page still presents tasks as uniform list rows that feel like a backlog table, not a work surface. Critical missing elements:

1. **No horizontal "Today" lane** - All tasks in a single vertical list
2. **No inline actions** - Only completion and delete, no snooze/reschedule/effort/priority edits
3. **No linked entity context** - Company/project/source email not surfaced on cards
4. **No effort estimation** - DB columns don't exist, UI shows nothing
5. **No visual hierarchy** - Cards look nearly identical regardless of urgency
6. **Sections don't help** - "Due Soon / Next Up / Later" grouping is too abstract

---

## Solution Overview

Transform the Tasks page with:

1. **Horizontal "Today" lane** at the top with 3-5 high-priority cards
2. **Time-based vertical sections** (Due Tomorrow, This Week, Upcoming)
3. **Rich task cards** with linked entity context, effort chips, and inline actions
4. **Inline editing** for priority, due date, effort, and status via popovers
5. **Company/Project/Email context** surfaced directly on cards
6. **Effort estimation** with new DB columns and inline editing

---

## Database Changes Required

### New Columns on `tasks` Table

```sql
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS effort_minutes INTEGER,
ADD COLUMN IF NOT EXISTS effort_category TEXT CHECK (effort_category IN ('quick', 'medium', 'deep', 'unknown'));
```

These columns enable:
- `effort_minutes`: Numeric estimate (5, 15, 30, 60, etc.)
- `effort_category`: Derived category for visual treatment

---

## Technical Implementation

### 1. New Component: TodayTaskCard (Horizontal Mini Card)

**File**: `src/components/tasks/TodayTaskCard.tsx` (NEW)

A compact horizontal card for the "Today" lane:

```text
+-----------------------------------------------------------------------+
| [O] Follow up on Reins deck     OatFi     Today  P1  15m   [..][>]   |
+-----------------------------------------------------------------------+
```

Features:
- Compact single-row layout
- Checkbox on left
- Title (truncated)
- Entity pill (company logo + name, or project color + name, or "Email" icon)
- Due badge (Today/Overdue)
- Priority badge (P1/P2/P3)
- Effort chip (5m/15m/30m/1h+)
- Action icons on right (always visible): Snooze, Reschedule, More

**Key Props**:
```typescript
interface TodayTaskCardProps {
  task: EnrichedTask;
  onComplete: (id: string) => void;
  onSnooze: (id: string, until: Date) => void;
  onReschedule: (id: string, date: Date) => void;
  onUpdatePriority: (id: string, priority: string) => void;
  onUpdateEffort: (id: string, minutes: number) => void;
  onClick: (task: Task) => void;
}
```

### 2. New Component: TaskProcessingCard (Enhanced Vertical Card)

**File**: `src/components/tasks/TaskProcessingCard.tsx` (NEW)

An enhanced card for the vertical sections:

```text
+----------------------------------------------------------+
| [O] Pull together overview of proposed...                |
|     [OatFi logo] OatFi                                   |
|     Feb 3  ·  P1  ·  30m                                 |
|                                     [snooze] [cal] [...]  |
+----------------------------------------------------------+
```

Features:
- Larger checkbox with priority-colored border
- Multi-line title support
- Context anchor row (one entity: company > project > email)
- Metadata row with all badges
- Hover-reveal action buttons
- Visual hierarchy: overdue > today > tomorrow > later (opacity/padding)

### 3. New Component: TodayLane (Horizontal Scrolling Lane)

**File**: `src/components/tasks/TodayLane.tsx` (NEW)

A horizontal lane at the top of the main content:

```typescript
interface TodayLaneProps {
  tasks: EnrichedTask[];
  onComplete: (id: string) => void;
  onSnooze: (id: string, until: Date) => void;
  onReschedule: (id: string, date: Date) => void;
  onUpdatePriority: (id: string, priority: string) => void;
  onUpdateEffort: (id: string, minutes: number) => void;
  onClick: (task: Task) => void;
}
```

**Selection Logic** (rules-based, max 5 cards):
```typescript
const todayTasks = useMemo(() => {
  // Priority order for selection:
  // 1. Overdue (sorted by how overdue)
  // 2. Due today (sorted by priority)
  // 3. Highest priority (high) due tomorrow
  // 4. Shortest effort as tiebreaker
  
  const candidates = tasks.filter(t => !t.completed && !t.archived_at);
  
  const overdue = candidates.filter(isOverdue).sort(byMostOverdue);
  const dueToday = candidates.filter(isDueToday).sort(byPriority);
  const highPriorityTomorrow = candidates
    .filter(t => isDueTomorrow(t) && t.priority === 'high')
    .sort(byEffort);
  
  // Combine and take first 5
  return [...overdue, ...dueToday, ...highPriorityTomorrow]
    .slice(0, 5);
}, [tasks]);
```

### 4. New Component: InlineTaskActions

**File**: `src/components/tasks/InlineTaskActions.tsx` (NEW)

Reusable inline action buttons with popovers:

```typescript
interface InlineTaskActionsProps {
  task: Task;
  onSnooze: (until: Date) => void;
  onReschedule: (date: Date) => void;
  onUpdatePriority: (priority: string) => void;
  onUpdateEffort: (minutes: number, category: string) => void;
  onArchive: () => void;
  onDelete: () => void;
  variant: 'compact' | 'full'; // compact for TodayLane, full for sections
}
```

Leverages existing patterns:
- `useSnooze` hook for snooze functionality
- `SuggestionChip` pattern from `InlineTaskForm.tsx` for popovers
- `QuickDatePicks` component for date selection
- `PriorityOptions` component for priority selection

**New EffortOptions Component**:
```typescript
function EffortOptions({ 
  value, 
  onChange 
}: { 
  value?: number; 
  onChange: (minutes: number, category: string) => void 
}) {
  const options = [
    { minutes: 5, label: '5m', category: 'quick' },
    { minutes: 15, label: '15m', category: 'quick' },
    { minutes: 30, label: '30m', category: 'medium' },
    { minutes: 60, label: '1h', category: 'deep' },
    { minutes: 120, label: '2h+', category: 'deep' },
  ];
  // ... render buttons
}
```

### 5. New Hook: useEnrichedTasks

**File**: `src/hooks/useEnrichedTasks.ts` (NEW)

Enriches tasks with company data for display:

```typescript
export interface EnrichedTask extends Task {
  linkedEntity?: {
    type: 'portfolio' | 'pipeline' | 'project' | 'email';
    id: string;
    name: string;
    logo_url?: string | null;
    color?: string;
  };
}

export function useEnrichedTasks(tasks: Task[]) {
  // Fetch all portfolio companies
  const { companies: portfolioCompanies } = useDashboardPortfolioCompanies();
  // Fetch all pipeline companies
  const { companies: pipelineCompanies } = useDashboardPipelineFocus();
  
  const enrichedTasks = useMemo(() => {
    const portfolioMap = new Map(portfolioCompanies.map(c => [c.id, c]));
    const pipelineMap = new Map(pipelineCompanies.map(c => [c.id, c]));
    
    return tasks.map(task => {
      let linkedEntity: EnrichedTask['linkedEntity'] = undefined;
      
      // Priority: pipeline_company > company > project > email
      if (task.pipeline_company_id) {
        const company = pipelineMap.get(task.pipeline_company_id);
        if (company) {
          linkedEntity = {
            type: 'pipeline',
            id: company.id,
            name: company.company_name,
            logo_url: company.logo_url,
          };
        }
      } else if (task.company_id) {
        const company = portfolioMap.get(task.company_id);
        if (company) {
          linkedEntity = {
            type: 'portfolio',
            id: company.id,
            name: company.name,
            logo_url: company.logo_url,
          };
        }
      } else if (task.project) {
        linkedEntity = {
          type: 'project',
          id: task.project.id,
          name: task.project.name,
          color: task.project.color,
        };
      } else if (task.source_inbox_item_id) {
        linkedEntity = {
          type: 'email',
          id: task.source_inbox_item_id,
          name: 'From email',
        };
      }
      
      return { ...task, linkedEntity };
    });
  }, [tasks, portfolioCompanies, pipelineCompanies]);
  
  return enrichedTasks;
}
```

### 6. Update TaskGroupedList: Time-Based Sections

**File**: `src/components/tasks/TaskGroupedList.tsx` (MODIFY)

Change from abstract sections to time-based sections:

```typescript
const taskGroups = useMemo(() => {
  const groups: TaskGroup[] = [];
  const assigned = new Set<string>();
  
  // 1. Due Tomorrow
  const dueTomorrow = tasks.filter(t => {
    if (assigned.has(t.id)) return false;
    if (isDueTomorrow(t.scheduledFor)) {
      assigned.add(t.id);
      return true;
    }
    return false;
  });
  if (dueTomorrow.length > 0) {
    groups.push({ 
      label: 'Due Tomorrow', 
      sublabel: format(addDays(new Date(), 1), 'EEEE'),
      tasks: dueTomorrow,
      visualWeight: 'high'
    });
  }
  
  // 2. This Week (next 5 days, excluding today/tomorrow)
  const thisWeek = tasks.filter(t => {
    if (assigned.has(t.id)) return false;
    if (isWithinDays(t.scheduledFor, 2, 7)) {
      assigned.add(t.id);
      return true;
    }
    return false;
  });
  if (thisWeek.length > 0) {
    groups.push({ 
      label: 'This Week', 
      tasks: thisWeek,
      visualWeight: 'medium'
    });
  }
  
  // 3. Upcoming (everything else with a date)
  const upcoming = tasks.filter(t => {
    if (assigned.has(t.id)) return false;
    if (t.scheduledFor) {
      assigned.add(t.id);
      return true;
    }
    return false;
  });
  if (upcoming.length > 0) {
    groups.push({ 
      label: 'Upcoming', 
      tasks: upcoming,
      visualWeight: 'low'
    });
  }
  
  // 4. No Date (backlog)
  const noDate = tasks.filter(t => !assigned.has(t.id));
  if (noDate.length > 0) {
    groups.push({ 
      label: 'No Date', 
      tasks: noDate,
      visualWeight: 'muted'
    });
  }
  
  return groups;
}, [tasks]);
```

### 7. Update Tasks.tsx: Integrate New Components

**File**: `src/pages/Tasks.tsx` (MODIFY)

Main content structure:

```typescript
// Use enriched tasks
const enrichedTasks = useEnrichedTasks(filteredTasks);

// Separate Today tasks from rest
const { todayTasks, remainingTasks } = useMemo(() => {
  // Today lane selection logic
  const candidates = enrichedTasks.filter(t => !t.completed);
  const today = selectTodayTasks(candidates, 5);
  const todayIds = new Set(today.map(t => t.id));
  const remaining = enrichedTasks.filter(t => !todayIds.has(t.id));
  return { todayTasks: today, remainingTasks: remaining };
}, [enrichedTasks]);

// Render
return (
  <div className="space-y-5">
    {/* Quick Add Input */}
    <QuickTaskInput onAddTask={handleAddTask_click} />
    
    {/* Today Lane */}
    {todayTasks.length > 0 && (
      <TodayLane
        tasks={todayTasks}
        onComplete={handleCompleteTask}
        onSnooze={handleSnoozeTask}
        onReschedule={handleRescheduleTask}
        onUpdatePriority={(id, p) => quickInlineUpdate(id, { priority: p })}
        onUpdateEffort={(id, m, c) => quickInlineUpdate(id, { effort_minutes: m, effort_category: c })}
        onClick={handleTaskClick}
      />
    )}
    
    {/* Time-Based Sections */}
    <TaskGroupedList
      tasks={remainingTasks}
      onTaskComplete={handleCompleteTask}
      onTaskDelete={handleDeleteTask}
      onTaskClick={handleTaskClick}
      onSnooze={handleSnoozeTask}
      onReschedule={handleRescheduleTask}
      onUpdatePriority={(id, p) => quickInlineUpdate(id, { priority: p })}
      onUpdateEffort={(id, m, c) => quickInlineUpdate(id, { effort_minutes: m, effort_category: c })}
    />
  </div>
);
```

### 8. Update useTasksManager: Add Snooze/Reschedule Handlers

**File**: `src/hooks/useTasksManager.tsx` (MODIFY)

Add new handlers:

```typescript
const { snooze } = useSnooze();

const handleSnoozeTask = async (id: string, until: Date) => {
  await snooze('task', id, until);
  // Optimistic update handled by useSnooze
};

const handleRescheduleTask = (id: string, date: Date) => {
  updateTask(id, { scheduled_for: date.toISOString() });
};

const handleUpdateEffort = (id: string, minutes: number, category: string) => {
  updateTask(id, { effort_minutes: minutes, effort_category: category });
};

return {
  // ... existing returns
  handleSnoozeTask,
  handleRescheduleTask,
  handleUpdateEffort,
};
```

### 9. New Component: EntityPill (Linked Entity Display)

**File**: `src/components/tasks/EntityPill.tsx` (NEW)

Displays the linked entity with appropriate styling:

```typescript
interface EntityPillProps {
  entity: EnrichedTask['linkedEntity'];
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export function EntityPill({ entity, onClick, size = 'sm' }: EntityPillProps) {
  if (!entity) return null;
  
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5",
        "bg-muted/50 hover:bg-muted transition-colors text-xs",
        "max-w-[140px] truncate"
      )}
    >
      {entity.type === 'email' ? (
        <Mail className={cn(iconSize, "text-sky-500 flex-shrink-0")} />
      ) : entity.logo_url ? (
        <img 
          src={entity.logo_url} 
          className={cn(iconSize, "rounded-sm object-contain flex-shrink-0")} 
          alt="" 
        />
      ) : entity.color ? (
        <div 
          className={cn(iconSize, "rounded-sm flex-shrink-0")} 
          style={{ backgroundColor: entity.color }} 
        />
      ) : (
        <Building2 className={cn(iconSize, "text-muted-foreground flex-shrink-0")} />
      )}
      <span className="truncate text-muted-foreground">{entity.name}</span>
    </button>
  );
}
```

### 10. Update TaskCardEffort: Support Inline Editing

**File**: `src/components/task-cards/TaskCardEffort.tsx` (MODIFY)

Make effort chip interactive:

```typescript
interface TaskCardEffortProps {
  effortMinutes?: number | null;
  effortCategory?: 'quick' | 'medium' | 'deep' | 'unknown' | null;
  editable?: boolean;
  onEdit?: (minutes: number, category: string) => void;
  className?: string;
}

export function TaskCardEffort({ 
  effortMinutes, 
  effortCategory, 
  editable = false,
  onEdit,
  className 
}: TaskCardEffortProps) {
  // ... existing logic
  
  if (editable && onEdit) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className={cn(baseStyles, config.className, "cursor-pointer", className)}>
            <Icon className="h-2.5 w-2.5" />
            {displayLabel}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-2">
          <EffortOptions value={effortMinutes} onChange={onEdit} />
        </PopoverContent>
      </Popover>
    );
  }
  
  return (
    <span className={cn(baseStyles, config.className, className)}>
      <Icon className="h-2.5 w-2.5" />
      {displayLabel}
    </span>
  );
}
```

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| **Database Migration** | CREATE | Add `effort_minutes` and `effort_category` columns to tasks |
| `src/components/tasks/TodayTaskCard.tsx` | CREATE | Compact horizontal card for Today lane |
| `src/components/tasks/TaskProcessingCard.tsx` | CREATE | Enhanced vertical card with inline actions |
| `src/components/tasks/TodayLane.tsx` | CREATE | Horizontal scrolling lane with selection logic |
| `src/components/tasks/InlineTaskActions.tsx` | CREATE | Reusable inline action buttons with popovers |
| `src/components/tasks/EntityPill.tsx` | CREATE | Linked entity display component |
| `src/hooks/useEnrichedTasks.ts` | CREATE | Enrich tasks with company/project data |
| `src/components/tasks/TaskGroupedList.tsx` | MODIFY | Time-based sections (Tomorrow, This Week, Upcoming) |
| `src/components/task-cards/TaskCardEffort.tsx` | MODIFY | Add editable mode with popover |
| `src/pages/Tasks.tsx` | MODIFY | Integrate TodayLane, enriched tasks, new handlers |
| `src/hooks/useTasksManager.tsx` | MODIFY | Add snooze, reschedule, effort handlers |
| `src/hooks/useTasks.ts` | MODIFY | Map new effort columns from DB |

---

## Visual Hierarchy Rules

```text
OVERDUE:
- Red left border (2px)
- Extra padding (py-4)
- Larger checkbox (7x7)
- Full opacity

DUE TODAY:
- Amber left border (2px)
- Standard padding (py-3)
- Standard checkbox (6x6)
- Full opacity

DUE TOMORROW:
- No left border
- Standard padding (py-3)
- Standard checkbox (6x6)
- Full opacity

LATER:
- No left border
- Compact padding (py-2.5)
- Smaller checkbox (5x5)
- Reduced opacity (0.8)

NO DATE:
- No left border
- Compact padding (py-2)
- Muted styling
- Reduced opacity (0.7)
```

---

## Styling Guidelines (Glassmorphic Premium)

```typescript
// Card base
const cardBase = cn(
  "rounded-xl transition-all duration-200",
  "bg-white/60 dark:bg-white/[0.04]",
  "border border-white/20 dark:border-white/[0.08]",
  "backdrop-blur-sm",
  "hover:bg-white/80 dark:hover:bg-white/[0.08]",
  "hover:shadow-sm"
);

// Today lane card (horizontal)
const todayCard = cn(
  cardBase,
  "flex items-center gap-3 px-3 py-2",
  "min-w-[280px] max-w-[320px]"
);

// Processing card (vertical)
const processingCard = cn(
  cardBase,
  "p-4 space-y-2 cursor-pointer",
  "hover:-translate-y-0.5"
);
```

---

## Success Criteria

After implementation:
1. Opening Tasks shows a horizontal "Today" lane with 3-5 priority tasks
2. Each card shows linked entity context (company logo/project/email indicator)
3. Users can complete, snooze, reschedule, change priority, and set effort without opening Task Detail
4. Time-based sections (Tomorrow, This Week, Upcoming) replace abstract groupings
5. Visual hierarchy makes urgent tasks immediately scannable
6. The page feels like a "knock these out" work surface, not a backlog database

