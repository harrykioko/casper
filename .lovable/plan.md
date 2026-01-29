
# Accept and Link Attachments - Implementation Plan

## Problem Analysis

Currently, when a task is created from an inbox item:
1. The `TaskPrefillOptions` includes `sourceInboxItemId` (line 181 in Inbox.tsx)
2. But when the task is actually created, only `content` is passed: `createTask({ content })` (line 381)
3. The `source_inbox_item_id` column exists on the tasks table but is never populated
4. Inbox attachments are stored in `inbox_attachments` but have no way to be accessed from tasks

Users cannot currently access email attachments from tasks that were created from inbox items, even though the infrastructure partially exists.

## Solution Architecture

Implement a two-phase approach:
1. **Phase 1 - Wiring**: Connect the `source_inbox_item_id` when creating tasks from inbox items
2. **Phase 2 - Display & Linking**: Show inbox attachments on tasks that originated from inbox items, and allow "accepting" (copying/linking) attachments to tasks

```text
┌─────────────────────┐         ┌─────────────────────┐
│   Inbox Item        │         │      Task           │
│   ─────────────     │         │   ───────────       │
│   • subject         │ creates │   • content         │
│   • attachments[]   │────────▶│   • source_inbox_   │
│                     │         │     item_id ────────┼───┐
└─────────────────────┘         └─────────────────────┘   │
         │                                                │
         │ has                                   references
         ▼                                                │
┌─────────────────────┐                                   │
│ inbox_attachments   │◀──────────────────────────────────┘
│   ─────────────     │   (can fetch attachments via FK)
│   • filename        │
│   • storage_path    │
└─────────────────────┘
```

## Phase 1: Wire `source_inbox_item_id` to Task Creation

### 1.1 Update AddTaskDialog to Pass Full Task Data

**File: `src/components/modals/AddTaskDialog.tsx`**

Update the `onAddTask` callback to include the full prefill data:

```typescript
interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTask: (taskData: {
    content: string;
    description?: string;
    source_inbox_item_id?: string;
    company_id?: string;
    pipeline_company_id?: string;
  }) => void;
  prefill?: TaskPrefillOptions;
}
```

Update `handleSubmit` to include the source link:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  // ...
  onAddTask({
    content: taskContent,
    // Include source_inbox_item_id from prefill
    source_inbox_item_id: prefill?.sourceInboxItemId,
  });
};
```

### 1.2 Update Inbox.tsx to Handle Full Task Data

**File: `src/pages/Inbox.tsx`**

Change line 381 from:
```typescript
onAddTask={(content) => createTask({ content })}
```

To:
```typescript
onAddTask={(taskData) => createTask(taskData)}
```

## Phase 2: Display Linked Attachments on Tasks

### 2.1 Create Hook to Fetch Attachments for Task

**New File: `src/hooks/useTaskAttachments.ts`**

A hook that fetches attachments linked to a task via its `source_inbox_item_id`:

```typescript
export function useTaskAttachments(taskId: string | undefined) {
  // 1. Fetch the task to get source_inbox_item_id
  // 2. If source_inbox_item_id exists, fetch inbox_attachments
  // 3. Return attachments with getSignedUrl helper
}
```

### 2.2 Add Attachments Section to TaskDetailsDialog

**File: `src/components/modals/TaskDetailsDialog.tsx`**

Add a collapsible "Attachments" section that:
- Shows attachments from the source inbox item (if any)
- Allows previewing/downloading attachments
- Reuses existing `AttachmentCard` and `AttachmentPreview` patterns

### 2.3 Create Polymorphic Attachment Links Table (Future Enhancement)

For full attachment portability across entities (tasks, notes, projects), a polymorphic `attachment_links` table could be added:

```sql
CREATE TABLE attachment_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attachment_source_type TEXT NOT NULL, -- 'inbox' | 'pipeline' | 'project'
  attachment_source_id uuid NOT NULL,
  target_type TEXT NOT NULL, -- 'task' | 'note' | 'project' | 'company'
  target_id uuid NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Note**: For MVP, we can achieve attachment viewing via the FK relationship (task → inbox_item → inbox_attachments) without needing a new linking table.

## Phase 3: UI for "Accept" Action

### 3.1 Add Attachment Actions in InboxActionRail

**File: `src/components/inbox/InboxActionRail.tsx`**

Add "Link Attachments" action that:
- Shows when the inbox item has attachments
- Opens a picker to select which attachments to link
- Creates task with selected attachment references

### 3.2 Attachment Indicator on Inbox Items

**File: `src/components/inbox/InboxItemRow.tsx`**

Add a small attachment icon/count indicator when an inbox item has attachments.

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/modals/AddTaskDialog.tsx` | Modify | Accept full task data including source_inbox_item_id |
| `src/pages/Inbox.tsx` | Modify | Pass full task data to createTask, not just content |
| `src/hooks/useTasks.ts` | Verify | Ensure source_inbox_item_id is passed to database |
| `src/hooks/useTaskAttachments.ts` | Create | Hook to fetch attachments for a task via source inbox item |
| `src/components/modals/TaskDetailsDialog.tsx` | Modify | Add attachments section showing source attachments |
| `src/components/inbox/InboxItemRow.tsx` | Modify | Add attachment count indicator |
| `src/components/inbox/InboxActionRail.tsx` | Modify | Add attachment linking awareness |

## Implementation Order

1. **Phase 1 - Wiring** (Foundation)
   - Update AddTaskDialog to pass source_inbox_item_id
   - Update Inbox.tsx to pass full task data to createTask
   - Verify useTasks.ts handles source_inbox_item_id

2. **Phase 2 - Display**
   - Create useTaskAttachments hook
   - Add TaskAttachmentsSection component
   - Integrate into TaskDetailsDialog

3. **Phase 3 - Polish**
   - Add attachment indicator to InboxItemRow
   - Add "includes attachments" awareness to InboxActionRail
   - Show attachment count in task creation confirmation

## Technical Details

### Database Query for Task Attachments

When viewing a task, fetch attachments via the source inbox item:

```typescript
// In useTaskAttachments hook
const { data: task } = await supabase
  .from('tasks')
  .select('source_inbox_item_id')
  .eq('id', taskId)
  .single();

if (task?.source_inbox_item_id) {
  const { data: attachments } = await supabase
    .from('inbox_attachments')
    .select('*')
    .eq('inbox_item_id', task.source_inbox_item_id);
}
```

### Signed URL Generation

Reuse the existing `getSignedUrl` pattern from `useInboxAttachments`:

```typescript
const getSignedUrl = async (storagePath: string) => {
  const { data } = await supabase.storage
    .from('inbox-attachments')
    .createSignedUrl(storagePath, 3600);
  return data?.signedUrl;
};
```

### Component Reuse

Reuse existing attachment display components:
- `AttachmentCard` from InboxAttachmentsSection
- `AttachmentPreview` for inline preview
- `formatFileSize`, `getFileIcon`, `canPreviewInline` helpers

## Acceptance Criteria

1. When creating a task from an inbox item, `source_inbox_item_id` is saved to the database
2. TaskDetailsDialog shows "Source Attachments" section when task has source inbox item
3. Users can preview and download attachments from the task view
4. InboxItemRow shows attachment count indicator when attachments exist
5. InboxActionRail indicates when task will include attachments
6. Existing inbox attachment functionality continues to work unchanged
