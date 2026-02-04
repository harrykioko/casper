
# Add Quick Actions for Calendar Events in Triage

## Overview

This plan adds hover-revealed quick actions to calendar event items in the Triage queue, matching the existing patterns for emails, reading items, and commitments. This allows users to quickly clear most calendar items without opening the modal.

---

## Current State

Calendar events currently show no quick actions on hover:

```text
[Calendar Icon] Meeting Title              about 1 hour ago
               [Unlinked] [~15m]
```

While other source types (emails, reading, commitments) already have hover actions:

- **Email**: Mark Trusted, Snooze dropdown, No Action
- **Reading**: Open Link, Queue, Up Next, Archive, Snooze
- **Commitment**: Mark Complete, Snooze

---

## Proposed Solution

Add three quick actions for calendar events on hover:

1. **Trusted** (checkmark) - Mark as trusted and clear from triage
2. **Snooze** (clock with dropdown) - Defer to later
3. **No Action** (x-circle) - Dismiss from triage

```text
[Calendar Icon] Meeting Title          [✓] [🕐▾] [✕]  about 1 hour ago
               [Unlinked] [~15m]
```

---

## Implementation Details

### 1. Add Calendar Event Handler Props to TriageItemRow

**File: `src/components/focus/TriageItemRow.tsx`**

Add new props for calendar quick actions:

```typescript
interface TriageItemRowProps {
  // ... existing props
  // Calendar event quick action handlers
  onCalendarTrusted?: (workItemId: string) => void;
  onCalendarNoAction?: (workItemId: string) => void;
  // onSnooze already exists and is shared
}
```

### 2. Add Calendar Quick Actions Block

In the same file, add a new conditional block after the commitment actions:

```tsx
{/* Calendar Event Quick Actions - visible on hover */}
{isCalendarEvent && (
  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 rounded-full"
      onClick={handleCalendarTrusted}
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
        <DropdownMenuItem onClick={(e) => handleSnooze(addHours(new Date(), 3), e)}>
          3 hours
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => handleSnooze(startOfTomorrow(), e)}>
          Tomorrow
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => handleSnooze(nextMonday(new Date()), e)}>
          Next week
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => handleSnooze(addDays(new Date(), 30), e)}>
          30 days
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 rounded-full"
      onClick={handleCalendarNoAction}
      title="No action (dismiss)"
    >
      <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
    </Button>
  </div>
)}
```

Add handler functions:

```typescript
const isCalendarEvent = item.source_type === "calendar_event";

const handleCalendarTrusted = (e: React.MouseEvent) => {
  e.stopPropagation();
  onCalendarTrusted?.(item.id);
};

const handleCalendarNoAction = (e: React.MouseEvent) => {
  e.stopPropagation();
  onCalendarNoAction?.(item.id);
};
```

### 3. Wire Handlers in TriageQueue Page

**File: `src/pages/TriageQueue.tsx`**

Add callback handlers for calendar events:

```typescript
// Calendar quick action handlers
const handleCalendarTrusted = useCallback(
  (workItemId: string) => {
    triageActions.markTrusted(workItemId);
    advanceToNext();
  },
  [triageActions, advanceToNext]
);

const handleCalendarNoAction = useCallback(
  (workItemId: string) => {
    triageActions.noAction(workItemId);
    advanceToNext();
  },
  [triageActions, advanceToNext]
);
```

Pass props to TriageItemRow:

```tsx
<TriageItemRow
  key={item.id}
  item={item}
  // ... existing props
  onCalendarTrusted={handleCalendarTrusted}
  onCalendarNoAction={handleCalendarNoAction}
  onSnooze={(id, until) => triageActions.snooze(id, until)}
/>
```

---

## Files Changed Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/focus/TriageItemRow.tsx` | Modify | Add calendar event quick actions and handlers |
| `src/pages/TriageQueue.tsx` | Modify | Add calendar action callbacks and pass to TriageItemRow |

---

## Visual Result

**Before (calendar events):**
```text
[📅] Meeting Title                                    1 hour ago
     [Unlinked] [~15m]
```

**After (on hover):**
```text
[📅] Meeting Title              [✓] [🕐▾] [✕]        1 hour ago
     [Unlinked] [~15m]
```

Where:
- `[✓]` = Mark Trusted (emerald hover)
- `[🕐▾]` = Snooze dropdown (same as other types)
- `[✕]` = No Action / Dismiss (muted)

---

## Technical Notes

- Reuses existing `onSnooze` prop which is already passed to TriageItemRow
- Follows exact same pattern as email quick actions (Trusted + Snooze + No Action)
- Uses `e.stopPropagation()` to prevent row click from opening modal
- Uses existing `triageActions.markTrusted()` and `triageActions.noAction()` from the hook
- No new database changes or backend modifications needed
