
# Dynamic Dashboard Layout - Progressive Content Display

## Problem Analysis

The current dashboard layout renders all 6 panels in fixed grid positions regardless of whether they contain data. In the screenshot:
- **To-Do panel** shows "Nothing due today" empty state
- **Commitments panel** shows "No open commitments" empty state

These empty panels consume valuable screen real estate and create visual noise. The user wants a **progressive/dynamic layout** that only surfaces components when they have meaningful content.

## Solution Strategy

Implement a "content-aware" dashboard grid that:
1. Conditionally renders panels based on data availability
2. Uses CSS Grid `auto-fill` or flexbox to reflow remaining panels
3. Maintains visual hierarchy with priority panels always visible
4. Provides subtle "get started" prompts integrated elsewhere (hero band or command palette) instead of empty state cards

## Panel Categories

### Always Show (Core Panels)
These panels are essential to the command center and should always render:
- **Priority Items** - Core attention driver (shows "All caught up" when empty, which is valuable feedback)
- **Inbox** - Communication hub (shows "Inbox zero!" when empty, which is valuable feedback)
- **Companies** - Relationship grid (shows "No companies yet" with helpful CTA)
- **Reading List** - Knowledge capture (shows "No unread items" with add CTA)

### Conditionally Show (Hide When Empty)
These panels add value only when populated:
- **To-Do** - Hide when no tasks exist or all are completed
- **Commitments** - Hide when no open commitments exist

## Implementation Approach

### Step 1: Calculate Content Flags

Add computed booleans in `DashboardMainContent.tsx`:

```typescript
// Content visibility flags
const hasOpenTasks = tasks.filter(t => !t.completed).length > 0;
const hasOpenCommitments = commitments.length > 0; // Need to add useCommitments hook
```

### Step 2: Create Dynamic Grid Component

New component `DashboardDynamicGrid.tsx` that handles:
- Collecting visible panels as children
- Rendering with appropriate grid columns based on count
- Smooth transitions when panels appear/disappear

```typescript
// Example grid logic
const visiblePanels = [
  { key: 'priority', always: true },
  { key: 'inbox', always: true },
  { key: 'todo', visible: hasOpenTasks },
  { key: 'companies', always: true },
  { key: 'commitments', visible: hasOpenCommitments },
  { key: 'reading', always: true },
].filter(p => p.always || p.visible);

// Grid adapts: 2 cols when ≤4 panels, 3 cols when 5-6 panels
```

### Step 3: Update Hero Band Stats

The hero band currently shows counts for Priority, Inbox, and To-Dos. Update to:
- Only show To-Do stat when tasks exist
- Add Commitments count when commitments exist
- Dynamic stat badges based on what has content

### Step 4: Alternative Access Points

When panels are hidden, ensure users can still access features via:
- **Command palette (⌘K)** - "Add task", "Add commitment" commands
- **Hero band** - Quick action buttons for common creates
- **Context menus** - In company cards, etc.

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/dashboard/DashboardMainContent.tsx` | Modify | Add useCommitments hook, compute visibility flags, conditionally render panels |
| `src/components/dashboard/DashboardHeroBand.tsx` | Modify | Make stats dynamic based on content availability |
| `src/components/dashboard/DashboardDynamicGrid.tsx` | Create | Optional reusable grid wrapper with reflow logic |

## Detailed Implementation

### DashboardMainContent Changes

```typescript
// Add hook
const { commitments, loading: commitmentsLoading } = useCommitments({ status: 'open' });

// Compute visibility flags
const hasOpenTasks = tasks.filter(t => !t.completed).length > 0;
const hasOpenCommitments = commitments.length > 0;

// In Row 1 grid (Action Panels)
<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
  {/* Priority - always show */}
  <div className="w-full min-w-[260px]">
    <DashboardPrioritySection ... />
  </div>
  
  {/* Inbox - always show */}
  <div className="w-full min-w-[260px]">
    <InboxPanel ... />
  </div>
  
  {/* To-Do - only when tasks exist */}
  {hasOpenTasks && (
    <div className="w-full min-w-[260px]">
      <ActionPanel accentColor="emerald" ... />
    </div>
  )}
</div>

// In Row 2 grid (Secondary Panels)
<div className={cn(
  "grid gap-6",
  // Dynamic columns based on what's visible
  !hasOpenCommitments 
    ? "grid-cols-1 lg:grid-cols-2" // 2 panels
    : "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3" // 3 panels
)}>
  {/* Companies - always show */}
  <div className="w-full min-w-[260px]">
    <CompaniesCommandPane ... />
  </div>

  {/* Commitments - only when open commitments exist */}
  {hasOpenCommitments && (
    <div className="w-full min-w-[260px]">
      <CommitmentsPanel ... />
    </div>
  )}

  {/* Reading List - always show */}
  <div className={cn(
    "w-full min-w-[260px]",
    // Span 2 cols when commitments hidden on xl screens
    !hasOpenCommitments && "xl:col-span-1 lg:col-span-1"
  )}>
    <ReadingListSection ... />
  </div>
</div>
```

### Hero Band Dynamic Stats

```typescript
interface DashboardHeroBandProps {
  userName?: string;
  onCommandClick: () => void;
  priorityCount: number;
  inboxCount: number;
  todoCount: number;
  commitmentCount?: number; // Add optional
}

// Only render stats that have content or are always relevant
<div className="flex flex-col gap-1.5">
  <StatBadge count={priorityCount} label="Priority" />
  <StatBadge count={inboxCount} label="Inbox" />
  {todoCount > 0 && <StatBadge count={todoCount} label="To-Dos" />}
  {commitmentCount && commitmentCount > 0 && (
    <StatBadge count={commitmentCount} label="Commitments" />
  )}
</div>
```

## Visual Behavior

### When All Panels Have Content (6 panels)
```text
Row 1: [Priority] [Inbox] [To-Do]     (3 columns)
Row 2: [Companies] [Commitments] [Reading] (3 columns)
```

### When To-Do Empty (5 panels)
```text
Row 1: [Priority] [Inbox]              (2 columns, larger)
Row 2: [Companies] [Commitments] [Reading] (3 columns)
```

### When Both To-Do and Commitments Empty (4 panels)
```text
Row 1: [Priority] [Inbox]              (2 columns)
Row 2: [Companies] [Reading List]      (2 columns, each wider)
```

## Animation Considerations

Use Framer Motion's `AnimatePresence` for smooth panel appearance/disappearance:

```typescript
<AnimatePresence>
  {hasOpenTasks && (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="w-full min-w-[260px]"
    >
      <ToDoPanel ... />
    </motion.div>
  )}
</AnimatePresence>
```

## Edge Cases

1. **Loading states** - Show skeleton loaders initially, then conditionally render
2. **Tasks loading but commitments loaded** - Wait for all data before computing visibility
3. **User creates first task** - Panel should smoothly animate in
4. **User completes last task** - Panel should smoothly animate out

## Acceptance Criteria

1. To-Do panel only renders when `tasks.filter(t => !t.completed).length > 0`
2. Commitments panel only renders when `commitments.length > 0`
3. Grid layout reflows to fill available space when panels are hidden
4. Hero band stats dynamically show/hide based on content
5. Smooth animations when panels appear/disappear
6. All loading states handled gracefully (don't hide panels during loading)
7. Users can still create tasks/commitments via command palette when panels hidden
