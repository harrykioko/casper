
# Fix Activity Section Not Showing New Items

## Problem

After creating a pipeline company and a task from the email drawer, nothing shows up in the "Activity" section. This is due to two issues:

1. **Separate state instances**: The `InlineActionPanel` component calls `useTasks()` twice (lines 126 and 149), creating two independent state instances. When a task is created via `createTask`, only that instance's local state updates - the other instance that provides `tasks` for the Activity display remains stale.

2. **Missing activity logging**: Actions like creating pipeline companies, linking companies, and adding notes are not being logged to the `inbox_activity` table. The Activity section only shows tasks, missing all other action types.

## Solution

### Part 1: Consolidate `useTasks` calls

Merge the two separate `useTasks()` calls into a single call to ensure both `createTask` and `tasks` share the same state instance.

**File: `src/components/inbox/InlineActionPanel.tsx`**

```tsx
// Before (lines 126 and 149):
const { createTask } = useTasks();
// ... other code ...
const { tasks } = useTasks();

// After (single call):
const { tasks, createTask } = useTasks();
// Remove the duplicate call on line 149
```

### Part 2: Log all actions to `inbox_activity` table

Import and use the `useInboxActivity` hook to log all actions for the audit trail. This enables tracking all action types (not just tasks) in the Activity section.

**File: `src/components/inbox/InlineActionPanel.tsx`**

Add import and hook usage:
```tsx
import { useInboxActivity } from "@/hooks/useInboxActivity";
// ...
const { logActivity } = useInboxActivity();
```

Log activity after each successful action:

| Action Handler | `logActivity` call |
|----------------|-------------------|
| `handleConfirmTask` | `logActivity({ inboxItemId: item.id, actionType: "create_task", targetId: result.id, targetType: "task" })` |
| `handleConfirmLinkCompany` | `logActivity({ inboxItemId: item.id, actionType: "link_company", targetId: company.id, targetType: company.type })` |
| `handleConfirmNote` | `logActivity({ inboxItemId: item.id, actionType: "add_note", ... })` |
| `handleConfirmSaveAttachments` | `logActivity({ inboxItemId: item.id, actionType: "save_attachments", ... })` |
| `handleConfirmCreatePipeline` | `logActivity({ inboxItemId: item.id, actionType: "create_pipeline_company", targetId: newCompany.id, targetType: "pipeline_company" })` |

### Part 3: Create hook to fetch inbox activity

Create a new hook that fetches activity records from the `inbox_activity` table for a specific inbox item.

**New File: `src/hooks/useInboxItemActivity.ts`**

```tsx
export function useInboxItemActivity(inboxItemId: string) {
  // Fetch from inbox_activity table where inbox_item_id matches
  // Return { activities, loading, refetch }
}
```

### Part 4: Display combined activity in the panel

Update the Activity section to combine:
1. Tasks with `source_inbox_item_id` matching the current email
2. Activity records from `inbox_activity` table

This provides a complete timeline of all actions taken on the email.

**File: `src/components/inbox/InlineActionPanel.tsx`**

```tsx
const { activities, refetch: refetchActivity } = useInboxItemActivity(item.id);

const activityItems = useMemo(() => {
  const combined = [];
  
  // Add task-based activities
  relatedTasks.forEach(task => { ... });
  
  // Add logged activities (pipeline, link, notes, etc.)
  activities.forEach(activity => { ... });
  
  // Sort by timestamp descending
  return combined.sort((a, b) => b.createdAt - a.createdAt);
}, [relatedTasks, activities]);
```

### Part 5: Trigger refetch after actions

After each successful action, call `refetchActivity()` to immediately update the Activity section without waiting for a page refresh.

```tsx
const handleConfirmTask = async (data) => {
  const result = await createTask({ ... });
  if (result) {
    await logActivity({ ... });
    refetchActivity(); // Immediately update Activity section
    handleActionSuccess(...);
  }
};
```

---

## Files Changed

| File | Changes |
|------|---------|
| `src/components/inbox/InlineActionPanel.tsx` | Consolidate useTasks calls, add logActivity calls, integrate useInboxItemActivity, update activityItems useMemo |
| `src/hooks/useInboxItemActivity.ts` | Create new hook to fetch inbox_activity records |

---

## Technical Notes

- The `inbox_activity` table already exists with RLS policies for INSERT and SELECT by the creating user
- Activity types defined in `src/types/inboxActivity.ts` include: `create_task`, `link_company`, `create_pipeline_company`, `add_note`, `save_attachments`
- The new hook will use React's `useState`/`useEffect` pattern consistent with existing hooks like `useTasks`
