

# Add Quick Actions for Tasks in Triage

## Overview

Add hover-revealed quick actions to task items in the Triage queue, following the same pattern as emails and calendar events. This enables rapid processing of tasks without opening the drawer.

---

## Current State

Tasks currently show no quick actions on hover:

```text
[ListTodo Icon] Task Title              about 1 hour ago
               [Unlinked]
```

While emails and calendar events already have: Trusted + Snooze + No Action

---

## Proposed Quick Actions for Tasks

1. **Trusted** (checkmark) - Mark as trusted and clear from triage (promotes task out of inbox)
2. **Snooze** (clock with dropdown) - Defer to later
3. **No Action** (x-circle) - Dismiss from triage (promotes task out of inbox)

```text
[ListTodo Icon] Task Title          [✓] [🕐▾] [✕]  about 1 hour ago
               [Unlinked]
```

---

## Implementation Details

### 1. Add Task Handler Props to TriageItemRow

**File: `src/components/focus/TriageItemRow.tsx`**

Add new props in the interface (around line 53):

```typescript
// Task quick action handlers
onTaskTrusted?: (workItemId: string) => void;
onTaskNoAction?: (workItemId: string) => void;
// onSnooze already exists and is shared
```

### 2. Add Task Quick Actions Block

In the same file, add handler functions after the calendar handlers:

```typescript
const isTask = item.source_type === "task";

const handleTaskTrusted = (e: React.MouseEvent) => {
  e.stopPropagation();
  onTaskTrusted?.(item.id);
};

const handleTaskNoAction = (e: React.MouseEvent) => {
  e.stopPropagation();
  onTaskNoAction?.(item.id);
};
```

Add the quick action block after the calendar event block (after line 400):

```tsx
{/* Task Quick Actions - visible on hover */}
{isTask && (
  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 rounded-full"
      onClick={handleTaskTrusted}
      title="Mark trusted"
    >
      <Check className="h-3.5 w-3.5 text-muted-foreground" />
    </Button>
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full"
          title="Snooze"
        >
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={(e) => handleSnooze(addHours(new Date(), 3), e as any)}>
          3 hours
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => handleSnooze(startOfTomorrow(), e as any)}>
          Tomorrow
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => handleSnooze(nextMonday(new Date()), e as any)}>
          Next week
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => handleSnooze(addDays(new Date(), 30), e as any)}>
          30 days
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 rounded-full"
      onClick={handleTaskNoAction}
      title="No action (dismiss)"
    >
      <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
    </Button>
  </div>
)}
```

### 3. Wire Handlers in TriageQueue Page

**File: `src/pages/TriageQueue.tsx`**

Add callback handlers (after the calendar handlers around line 292):

```typescript
// Task quick action handlers
const handleTaskTrusted = useCallback(
  (workItemId: string) => {
    triageActions.markTrusted(workItemId);
    advanceToNext();
  },
  [triageActions, advanceToNext]
);

const handleTaskNoAction = useCallback(
  (workItemId: string) => {
    triageActions.noAction(workItemId);
    advanceToNext();
  },
  [triageActions, advanceToNext]
);
```

Pass props to TriageItemRow (in the render around line 386):

```tsx
<TriageItemRow
  key={item.id}
  item={item}
  // ... existing props
  onTaskTrusted={handleTaskTrusted}
  onTaskNoAction={handleTaskNoAction}
/>
```

---

## Files Changed Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/focus/TriageItemRow.tsx` | Modify | Add task quick action props, handlers, and UI block |
| `src/pages/TriageQueue.tsx` | Modify | Add task action callbacks and pass to TriageItemRow |

---

## Visual Result

**Before (tasks):**
```text
[📝] Task Title                                    1 hour ago
     [Unlinked]
```

**After (on hover):**
```text
[📝] Task Title              [✓] [🕐▾] [✕]        1 hour ago
     [Unlinked]
```

Where:
- `[✓]` = Mark Trusted (clears from triage, promotes task)
- `[🕐▾]` = Snooze dropdown (defer to later)
- `[✕]` = No Action / Dismiss (clears from triage, promotes task)

---

## Technical Notes

- Matches exact pattern used for emails and calendar events
- Uses existing `onSnooze` prop already passed to TriageItemRow
- Both Trusted and No Action will call the existing triage actions which also promote tasks out of inbox (`is_quick_task: false`)
- Uses optimistic updates already implemented - actions will feel instant
- No database or backend changes required

