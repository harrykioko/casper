

# Add Email Quick Actions to Focus Queue

## Problem Summary

Email items in the Focus Queue currently require clicking to open the FocusInboxDrawer before taking any action. Users want inline quick actions directly on the row for faster email triage, similar to what was just implemented for reading items.

## Behavior Requirements

Based on the user's request:
- **Mark Trusted**: Clears from Focus Queue only (sets work_item status to 'trusted')
- **Snooze**: Clears from Focus Queue only (sets work_item status to 'snoozed')
- **No Action**: Clears from Focus Queue AND marks inbox item as resolved (removes from Inbox entirely)

## Current State

- `FocusItemRow.tsx` has quick actions for reading items only
- `useFocusTriageActions` already provides `markTrusted`, `snooze`, and `noAction` functions
- `useInboxItems` provides `markComplete` which sets `is_resolved = true`
- The `noAction` function in `useWorkItemActions` only updates the work_item status, it doesn't touch the inbox item

---

## Implementation Details

### Part 1: Add Email Handler Props to FocusItemRow

**File: `src/components/focus/FocusItemRow.tsx`**

Add new props for email-specific actions:

```typescript
interface FocusItemRowProps {
  // ... existing props
  // Email quick action handlers
  onEmailTrusted?: (workItemId: string) => void;
  onEmailNoAction?: (workItemId: string, sourceId: string) => void;
  // onSnooze already exists and can be reused for emails
}
```

### Part 2: Add Email Quick Actions UI

Add a similar hover-revealed action section for email items:

```text
Email Quick Actions (visible on hover):
- Mark Trusted (Check icon) - clears from focus queue only
- Snooze dropdown (Clock icon) - snooze options (reuse existing)
- No Action (XCircle icon) - clears from focus queue AND archives from inbox
```

The UI pattern will match the reading item actions:
- `opacity-0 group-hover:opacity-100 transition-opacity`
- Small ghost buttons (h-6 w-6 rounded-full)
- Icons from lucide-react

### Part 3: Create Email-Specific Handlers in FocusQueue.tsx

**File: `src/pages/FocusQueue.tsx`**

Create handlers that combine work item actions with inbox actions:

```typescript
// Mark Trusted - only clears from focus queue
const handleEmailTrusted = useCallback(
  (workItemId: string) => {
    triageActions.markTrusted(workItemId);
    advanceToNext();
  },
  [triageActions, advanceToNext]
);

// No Action - clears from focus queue AND marks inbox as resolved
const handleEmailNoAction = useCallback(
  (workItemId: string, sourceId: string) => {
    triageActions.noAction(workItemId);  // Clears from focus queue
    markComplete(sourceId);               // Marks inbox item as resolved
    advanceToNext();
  },
  [triageActions, markComplete, advanceToNext]
);

// Snooze - reuse existing onSnooze prop (already works for all item types)
```

Pass these to FocusItemRow:

```tsx
<FocusItemRow
  // ... existing props
  onEmailTrusted={handleEmailTrusted}
  onEmailNoAction={handleEmailNoAction}
/>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/focus/FocusItemRow.tsx` | Add email action props, render hover buttons for email items |
| `src/pages/FocusQueue.tsx` | Create email handlers, pass to FocusItemRow |

---

## Visual Design

**Before (current email row):**
```text
[Mail] Re: Partnership opportunity                    2 hours ago
       Unlinked
```

**After (on hover):**
```text
[Mail] Re: Partnership opportunity      [✓][⏰][✕]   2 hours ago
       Unlinked
```

Where icons are:
- ✓ = Mark Trusted (Check icon) - keeps in inbox, removes from focus
- ⏰ = Snooze dropdown (Clock icon) - snooze options
- ✕ = No Action (XCircle icon) - removes from both focus queue AND inbox

---

## Technical Notes

1. Email items are identified by `source_type === 'email'`
2. The snooze dropdown is already implemented for reading items and can be reused
3. All actions use `e.stopPropagation()` to prevent opening the detail drawer
4. Actions automatically advance to the next item in the queue
5. Toast notifications are handled by the underlying hooks

