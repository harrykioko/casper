

# Optimistic Updates for Triage Quick Actions

## Problem

Quick actions in the Triage queue feel sluggish because the UI waits for the database operation to complete before updating the list. When processing multiple items, this delay makes it hard to move quickly through the queue.

**Current Flow:**
```text
User clicks action → API call → Wait... → Invalidate queries → Refetch → UI updates
                              ~300-500ms delay
```

**Desired Flow:**
```text
User clicks action → UI updates instantly → API call runs in background
                     0ms perceived delay
```

---

## Solution Overview

Implement optimistic updates at the `useTriageQueue` hook level by:

1. Exposing an `optimisticRemove` function that immediately removes an item from the cache
2. Using React Query's `setQueryData` to update the cache before the mutation completes
3. Handling rollback if the mutation fails (though this is rare)

---

## Implementation Details

### 1. Add Optimistic Update Function to useTriageQueue

**File: `src/hooks/useTriageQueue.ts`**

Add a new function that can instantly remove items from the cached queue:

```typescript
const optimisticRemove = useCallback(
  (workItemId: string) => {
    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (!oldData) return oldData;
      const newItems = oldData.items.filter((item: TriageQueueItem) => item.id !== workItemId);
      return {
        ...oldData,
        items: newItems,
        counts: computeCounts(newItems),
      };
    });
  },
  [queryClient, queryKey]
);
```

Return this function from the hook:

```typescript
return {
  items: filteredItems,
  allItems: data?.items || [],
  counts: data?.counts || emptyCounts(),
  isLoading,
  isAllClear,
  filters,
  toggleSourceType,
  toggleReasonCode,
  setEffortFilter,
  clearFilters,
  refetch,
  optimisticRemove, // NEW
};
```

### 2. Update useTriageActions to Accept Optimistic Callback

**File: `src/hooks/useTriageActions.ts`**

Modify the hook to accept an optional `onOptimisticRemove` callback that gets called immediately:

```typescript
export function useTriageActions(onOptimisticRemove?: (workItemId: string) => void) {
  // ... existing code

  const markTrusted = useCallback(
    (workItemId: string) => {
      onOptimisticRemove?.(workItemId); // Instant UI update
      actions.markTrusted(workItemId);
      setTimeout(invalidateTriage, 100);
    },
    [actions, invalidateTriage, onOptimisticRemove]
  );

  const snooze = useCallback(
    (workItemId: string, until: Date) => {
      onOptimisticRemove?.(workItemId); // Instant UI update
      actions.snooze(workItemId, until);
      setTimeout(invalidateTriage, 100);
    },
    [actions, invalidateTriage, onOptimisticRemove]
  );

  const noAction = useCallback(
    (workItemId: string) => {
      onOptimisticRemove?.(workItemId); // Instant UI update
      actions.noAction(workItemId);
      setTimeout(invalidateTriage, 100);
    },
    [actions, invalidateTriage, onOptimisticRemove]
  );

  // Similarly for commitment actions...
}
```

### 3. Update useTriageReadingActions for Optimistic Updates

**File: `src/hooks/useTriageReadingActions.ts`**

Same pattern - accept optional callback:

```typescript
export function useTriageReadingActions(onOptimisticRemove?: (workItemId: string) => void) {
  // ...

  const keepAsQueued = async (readingItemId: string, workItemId: string) => {
    onOptimisticRemove?.(workItemId); // Instant UI update
    
    await supabase
      .from("reading_items")
      .update({
        processing_status: "queued",
        processed_at: new Date().toISOString(),
      })
      .eq("id", readingItemId);

    await resolveWorkItem(workItemId);
    invalidate();
    toast.success("Added to queue");
  };

  // Same for markUpNext, archiveFromFocus...
}
```

### 4. Wire Up in TriageQueue Page

**File: `src/pages/TriageQueue.tsx`**

Pass the optimistic remove function to the action hooks:

```typescript
const {
  items,
  counts,
  isLoading,
  isAllClear,
  filters,
  toggleSourceType,
  toggleReasonCode,
  setEffortFilter,
  clearFilters,
  optimisticRemove, // NEW
} = useTriageQueue();

const triageActions = useTriageActions(optimisticRemove); // Pass callback
const readingActions = useTriageReadingActions(optimisticRemove); // Pass callback
```

### 5. Simplify advanceToNext Logic

Since items are removed optimistically, the `advanceToNext` function no longer needs to find the next item - the current selected item will naturally become the next one. However, we should update selection state:

```typescript
const advanceToNext = useCallback(() => {
  if (!selectedItem) return;
  // Clear selection - the next item will be at the same position
  // after optimistic removal
  setSelectedItem(null);
}, [selectedItem]);
```

Or keep the current behavior but make it work with the updated items list:

```typescript
// The items list will be updated optimistically, so we can rely on it
const advanceToNext = useCallback(() => {
  if (!selectedItem) return;
  // After optimistic removal, the item is already gone from the list
  // Just clear the selection since drawers will close anyway
  setSelectedItem(null);
}, [selectedItem]);
```

---

## Files Changed Summary

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useTriageQueue.ts` | Modify | Add `optimisticRemove` function using `queryClient.setQueryData` |
| `src/hooks/useTriageActions.ts` | Modify | Accept `onOptimisticRemove` callback, call it before mutations |
| `src/hooks/useTriageReadingActions.ts` | Modify | Accept `onOptimisticRemove` callback, call it before mutations |
| `src/pages/TriageQueue.tsx` | Modify | Wire optimisticRemove to action hooks |

---

## User Experience Improvement

**Before (current):**
1. Click "Mark Trusted" on item
2. Wait 300-500ms
3. Item disappears
4. Click next item
5. Repeat...

**After (optimistic):**
1. Click "Mark Trusted" on item
2. Item disappears instantly
3. Already moving to next item
4. Super fast triage flow!

---

## Error Handling

In the rare case a mutation fails:
- The `setTimeout(invalidateTriage, 100)` will refetch the queue
- This will restore any items that failed to update
- User sees a toast error explaining what went wrong
- No data loss - items just reappear in the queue

---

## Technical Notes

- Uses React Query's `setQueryData` for instant cache updates
- Maintains the same mutation logic - just adds optimistic UI layer
- Counts are recalculated when items are removed to keep summary panel in sync
- Works with all quick action types: email, calendar, reading, commitment, task
- No changes to database schema or edge functions required

