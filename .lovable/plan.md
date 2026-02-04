

# Tasks UI v3: Card Design & Visual Hierarchy Fix

## Problem Analysis

The current implementation has several critical design failures:

1. **Inverted visual weight**: The most important tasks (overdue/today) are visually cramped with the most red coloring, making them feel overwhelming and hard to read rather than prominent
2. **Excessive vertical stacking**: Every card stacks title → entity → metadata vertically, creating tall, dense cards
3. **Red P1 everywhere**: The `text-destructive` red on borders, checkboxes, and badges creates visual alarm fatigue
4. **Uniform card sizing**: All cards look essentially the same regardless of importance
5. **Today lane cards too cramped**: Horizontal cards try to fit too much, becoming unreadable

## Reference Mockup Analysis

The AI-generated mockup (image-80.png) demonstrates the correct approach:

### "Up Next" Hero Section
- 3-5 prominent hero card for the single most important task
- Large title (18-20px), readable description
- Context pills at TOP (entity, due date)
- Snooze + Complete buttons visible at bottom
- MUCH larger than other cards (~200px height vs ~60px for list items)
- Secondary card(s) beside it are simpler, smaller

### "Due Tomorrow" Section
- **Horizontal single-row layout** per task
- Checkbox + Title + Priority badge **on same line**
- Context/category as subtle text below, NOT stacked vertically
- Clean, scannable, minimal

### "Upcoming" Section
- Even simpler grid/tile layout
- Day + Category header
- Title
- Priority badge
- Avatar indicator in corner

### Key Takeaways
1. **Hero treatment** for top 3 tasks - not a horizontal scroll of cramped cards
2. **Single-line task rows** for sections - not tall stacked cards
3. **Priority badges are subtle** - small colored pill with text, no dramatic red borders
4. **Progressive detail reduction** - hero has most, upcoming has least
5. **Whitespace** - cards breathe, not cramped

---

## Solution: Complete Card System Redesign

### Component Changes Overview

| Component | Current State | Target State |
|-----------|--------------|--------------|
| `TodayLane` | 5 cramped horizontal cards | 1 hero card + 1-2 secondary cards |
| `TodayTaskCard` | Horizontal cramped row | Remove, replace with `HeroTaskCard` + `SecondaryTaskCard` |
| `TaskProcessingCard` | Tall vertical stacking | Clean horizontal single-row layout |
| `TaskGroupedList` | Same card for all sections | Different card styles per section weight |

---

## Technical Implementation

### 1. Remove TodayLane Horizontal Scroll - Replace with "Up Next" Hero Layout

**File**: `src/components/tasks/UpNextSection.tsx` (NEW - replaces TodayLane)

New component structure:
```text
+--------------------------------------------------+
| UP NEXT                                          |
| +----------------------+  +--------------------+ |
| | [Entity] [Due]       |  | [Entity]           | |
| |                      |  | Title text here    | |
| | Big Title Here       |  | Due Wednesday      | |
| |                      |  |       [dot]        | |
| | Description preview  |  +--------------------+ |
| |                      |                         |
| | [avatar] Snooze [Complete]                    |
| +----------------------+                         |
+--------------------------------------------------+
```

Key changes:
- Max 2 tasks shown (1 hero + 1 secondary)
- Hero card: ~180px height, large title (text-lg), shows description if exists
- Secondary card: ~120px height, simpler layout
- NO horizontal scrolling

**Hero Card Properties**:
- Title: 18px (text-lg), font-semibold
- Context pills at top: Entity + Due date
- Description preview (if available)
- Visible action buttons: Snooze + Complete
- Subtle left border accent (blue for primary context, not red)

### 2. Replace TaskProcessingCard with Clean Row Layout

**File**: `src/components/tasks/TaskRowCard.tsx` (NEW - replaces TaskProcessingCard)

The current `TaskProcessingCard` stacks everything vertically. Replace with a **horizontal single-row** layout:

```text
+----------------------------------------------------------+
| [O]  Task title goes here           [Entity] [Due] [P1]  |
+----------------------------------------------------------+
```

Alternate for tasks with entity on second line (only when entity exists):
```text
+----------------------------------------------------------+
| [O]  Task title goes here                     [Due] [P1] |
|      [Entity icon] Entity Name                           |
+----------------------------------------------------------+
```

Key properties:
- Checkbox + Title on primary row
- Metadata (due, priority) RIGHT-aligned on same row
- Entity pill only shown IF exists, tucked under title
- Single-line height when no entity (~48px)
- Two-line height when entity exists (~64px)
- NO large gaps, NO vertical card feel

**Priority badge styling changes**:
```typescript
// OLD: Dramatic red
high: { label: "P1", className: "bg-destructive/10 text-destructive border-destructive/20" }

// NEW: Subtle coral/orange, no border
high: { label: "P1", className: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" }
medium: { label: "P2", className: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" }
low: { label: "P3", className: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" }
```

### 3. Update TaskGroupedList Section Rendering

**File**: `src/components/tasks/TaskGroupedList.tsx` (MODIFY)

Change rendering based on section type:

```typescript
// Render function per section
function renderSection(group: TaskGroup) {
  if (group.id === 'overdue' || group.id === 'today') {
    // These get slightly more prominent treatment
    return <TaskRowCard variant="prominent" ... />
  }
  if (group.id === 'no-date') {
    // Muted, simpler
    return <TaskRowCard variant="muted" ... />
  }
  // Default
  return <TaskRowCard variant="default" ... />
}
```

**Visual weight via row styling, NOT card size:**

| Section | Row Treatment |
|---------|---------------|
| Overdue | Subtle rose-50 background, text slightly bolder |
| Today | Default styling, full opacity |
| Tomorrow | Default styling, full opacity |
| This Week | Slightly muted (opacity-90) |
| Upcoming | Muted (opacity-80), smaller checkbox |
| No Date | Most muted (opacity-70), smallest checkbox |

### 4. Remove Red Border Coloring from Cards

**Files**: `TaskProcessingCard.tsx`, `TodayTaskCard.tsx`

Remove:
```typescript
// DELETE THESE PATTERNS
isOverdueTask && "border-l-2 border-l-destructive"
isDueToday && "border-l-2 border-l-amber-500"
task.priority === 'high' && "border-destructive"
```

Replace with subtle background tinting:
```typescript
// Overdue row gets subtle rose tint
isOverdueTask && "bg-rose-50/50 dark:bg-rose-900/10"

// Today gets subtle amber tint
isDueToday && "bg-amber-50/30 dark:bg-amber-900/10"
```

### 5. Fix Priority Badge Colors Throughout

**File**: `src/components/task-cards/TaskCardPriority.tsx` (MODIFY if exists) or inline

New color scheme:
```typescript
const priorityConfig = {
  high: { 
    label: "P1", 
    className: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
  },
  medium: { 
    label: "P2", 
    className: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
  },
  low: { 
    label: "P3", 
    className: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
  },
};
```

No borders on priority badges. Pill-style: `rounded-full px-2 py-0.5 text-[11px] font-medium`

### 6. Simplify Today Lane to "Up Next" with Hero

**File**: `src/components/tasks/TodayLane.tsx` (REWRITE → `UpNextSection.tsx`)

New logic:
```typescript
// Only select TOP 1-2 tasks
const upNextTasks = useMemo(() => {
  // Same selection logic but limit to 2
  return selectTodayTasks(candidates, 2);
}, [tasks]);

// Render
return (
  <div className="space-y-4">
    <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
      <CircleDot className="h-4 w-4 text-primary" />
      Up Next
    </h2>
    
    <div className="flex gap-4">
      {/* Hero card - first task */}
      {upNextTasks[0] && (
        <HeroTaskCard task={upNextTasks[0]} ... />
      )}
      
      {/* Secondary card - second task (optional) */}
      {upNextTasks[1] && (
        <SecondaryTaskCard task={upNextTasks[1]} ... />
      )}
    </div>
  </div>
);
```

### 7. New HeroTaskCard Component

**File**: `src/components/tasks/HeroTaskCard.tsx` (NEW)

```typescript
// Large prominent card for the #1 task
export function HeroTaskCard({ task, onComplete, onSnooze, onClick }: Props) {
  return (
    <div className={cn(
      "flex-1 max-w-xl rounded-2xl p-5",
      "bg-white dark:bg-slate-900",
      "border border-slate-200 dark:border-slate-800",
      "shadow-sm"
    )}>
      {/* Context pills at top */}
      <div className="flex items-center gap-2 mb-3">
        {task.linkedEntity && <EntityPill entity={task.linkedEntity} size="md" />}
        {task.scheduledFor && <DuePill date={task.scheduledFor} />}
      </div>
      
      {/* Large title */}
      <h3 className="text-lg font-semibold text-foreground leading-snug mb-2">
        {task.content}
      </h3>
      
      {/* Description preview if exists */}
      {task.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {task.description}
        </p>
      )}
      
      {/* Bottom actions */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {/* Avatars or other context */}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => onSnooze(...)}>
            Snooze
          </Button>
          <Button size="sm" onClick={() => onComplete(task.id)}>
            <Check className="h-4 w-4 mr-1" />
            Complete
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### 8. New SecondaryTaskCard Component

**File**: `src/components/tasks/SecondaryTaskCard.tsx` (NEW)

Simpler, smaller card for the #2 position:
```typescript
export function SecondaryTaskCard({ task, onClick }: Props) {
  return (
    <div className={cn(
      "w-64 rounded-xl p-4",
      "bg-white dark:bg-slate-900",
      "border border-slate-200 dark:border-slate-800"
    )}>
      {/* Entity pill at top */}
      {task.linkedEntity && <EntityPill entity={task.linkedEntity} size="sm" />}
      
      {/* Title - medium size */}
      <h4 className="text-sm font-medium text-foreground mt-2 line-clamp-2">
        {task.content}
      </h4>
      
      {/* Due date */}
      {task.scheduledFor && (
        <p className="text-xs text-muted-foreground mt-2">
          Due {formatRelativeDate(task.scheduledFor)}
        </p>
      )}
      
      {/* Start working link */}
      <div className="flex justify-between items-center mt-3">
        <span className="text-xs text-muted-foreground">Start working</span>
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
      </div>
    </div>
  );
}
```

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/tasks/TodayLane.tsx` | DELETE | Replace with UpNextSection |
| `src/components/tasks/TodayTaskCard.tsx` | DELETE | Replace with HeroTaskCard/SecondaryTaskCard |
| `src/components/tasks/UpNextSection.tsx` | CREATE | New "Up Next" hero + secondary layout |
| `src/components/tasks/HeroTaskCard.tsx` | CREATE | Large hero card for #1 task |
| `src/components/tasks/SecondaryTaskCard.tsx` | CREATE | Smaller secondary card |
| `src/components/tasks/TaskRowCard.tsx` | CREATE | Clean horizontal row card for lists |
| `src/components/tasks/TaskProcessingCard.tsx` | DELETE | Replace with TaskRowCard |
| `src/components/tasks/TaskGroupedList.tsx` | MODIFY | Use TaskRowCard, adjust section styling |
| `src/pages/Tasks.tsx` | MODIFY | Replace TodayLane with UpNextSection |

---

## Styling Summary

### Colors (No More Aggressive Red)
- **Overdue**: Subtle rose-50 background, rose-600 due badge
- **Today**: Subtle amber-50 background, amber-600 due badge
- **Tomorrow**: Sky-100 due badge
- **Priority P1**: Rose-100 bg, rose-600 text (not destructive red)
- **Priority P2**: Amber-100 bg, amber-600 text
- **Priority P3**: Slate-100 bg, slate-500 text

### Layout
- Hero card: 180-200px height, 500px max-width
- Secondary card: 120px height, 260px width
- Row cards: 48-64px height, full width
- Spacing between rows: 8px (space-y-2)
- Spacing between sections: 24px (space-y-6)

### Typography
- Hero title: text-lg (18px) font-semibold
- Secondary title: text-sm (14px) font-medium
- Row title: text-sm (14px) font-medium
- Metadata: text-xs (12px) or text-[11px] font-medium

---

## Success Criteria

After implementation:
1. Opening Tasks shows "Up Next" with ONE large hero card (not 5 cramped cards)
2. Task rows in sections are clean horizontal layouts (checkbox + title + metadata on same line)
3. Priority badges are subtle colored pills, NOT aggressive red
4. Overdue/today tasks are distinguishable via subtle background tint, not jarring borders
5. Visual hierarchy is clear: Hero >> Row cards, with progressive muting down the page
6. Information density is balanced - important tasks are MORE readable, not harder to read

