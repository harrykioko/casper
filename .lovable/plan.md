
# Fix Activity Section Not Showing New Items

## Status: ✅ COMPLETED

## Problem (Fixed)

After creating a pipeline company and a task from the email drawer, nothing showed up in the "Activity" section. This was due to two issues:

1. **Separate state instances**: The `InlineActionPanel` component called `useTasks()` twice, creating two independent state instances.

2. **Missing activity logging**: Actions like creating pipeline companies, linking companies, and adding notes were not being logged to the `inbox_activity` table.

## Solution Implemented

### Part 1: Consolidated `useTasks` calls ✅

Merged the two separate `useTasks()` calls into a single call:
```tsx
const { tasks, createTask } = useTasks();
```

### Part 2: Added activity logging ✅

Added `useInboxActivity` hook and `logActivity` calls after each action:
- `handleConfirmTask` → logs `create_task`
- `handleConfirmLinkCompany` → logs `link_company`
- `handleConfirmSaveAttachments` → logs `save_attachments`
- `handleConfirmCreatePipeline` → logs `create_pipeline_company`

### Part 3: Created `useInboxItemActivity` hook ✅

New hook fetches activity records from the `inbox_activity` table for display in the Activity section.

### Part 4: Combined activity display ✅

Updated the Activity section to combine:
1. Tasks with `source_inbox_item_id` matching the current email
2. Activity records from `inbox_activity` table (excluding `create_task` to avoid duplicates)

Results are sorted by timestamp descending (newest first).

### Part 5: Immediate refetch ✅

After each action, `refetchActivity()` is called to immediately update the Activity section.

---

## Files Changed

| File | Changes |
|------|---------|
| `src/components/inbox/InlineActionPanel.tsx` | Consolidated useTasks, added logActivity calls, integrated useInboxItemActivity, updated activityItems |
| `src/hooks/useInboxItemActivity.ts` | Created new hook to fetch inbox_activity records |
| `src/types/inboxActivity.ts` | Added `add_note` and `save_attachments` action types |
