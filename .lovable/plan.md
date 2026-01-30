
# Fix Focus Queue: Auto-Create Work Items on Email Ingestion

## Problem Summary

The Focus Queue is empty because work items are never being created when emails arrive. The backfill SQL just executed successfully (network logs show items now), but **new emails won't appear** without modifying the ingestion pipeline.

**Root Cause:**
- `email-inbox-ingest` edge function creates inbox_items but doesn't create work_items
- `ensureWorkItem()` function exists but is never called from the ingestion flow
- The Focus Queue reads from `work_items` table, which remains empty without this step

## Solution

Modify the `email-inbox-ingest` edge function to insert a `work_items` record after successfully creating an inbox item.

---

## Implementation

### Part 1: Update Edge Function (`supabase/functions/email-inbox-ingest/index.ts`)

Add work_items insert after line 165 (after successful inbox_items insert):

```typescript
// After: console.log("Inserted inbox item", { ... });

// Create work item for Focus Queue
try {
  const workItemData = {
    created_by: user.id,
    source_type: 'email',
    source_id: inboxItemId,
    status: 'needs_review',
    reason_codes: ['unlinked_company', 'missing_summary'],
    priority: 5, // Emails are high priority
  };

  const { error: workItemError } = await supabaseClient
    .from("work_items")
    .insert(workItemData);

  if (workItemError) {
    console.error("Failed to create work item:", workItemError);
    // Non-blocking - email still ingested even if work item fails
  } else {
    console.log("Work item created for email:", inboxItemId);
  }
} catch (workItemErr) {
  console.error("Work item creation error:", workItemErr);
}
```

### Part 2: Backfill Existing Unresolved Emails

Run SQL to populate work_items for emails that already exist but haven't been processed:

```sql
-- One-time backfill for existing inbox_items
INSERT INTO work_items (created_by, source_type, source_id, status, reason_codes, priority)
SELECT 
  created_by,
  'email',
  id,
  'needs_review',
  ARRAY['unlinked_company', 'missing_summary']::text[],
  5
FROM inbox_items
WHERE is_resolved = false 
  AND is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM work_items 
    WHERE work_items.source_type = 'email' 
      AND work_items.source_id = inbox_items.id
      AND work_items.created_by = inbox_items.created_by
  );
```

### Part 3: (Optional) Backfill Unlinked Tasks

For tasks without company/project links:

```sql
INSERT INTO work_items (created_by, source_type, source_id, status, reason_codes, priority)
SELECT 
  created_by,
  'task',
  id,
  'needs_review',
  ARRAY['unlinked_company']::text[],
  2
FROM tasks
WHERE completed = false 
  AND project_id IS NULL 
  AND company_id IS NULL 
  AND pipeline_company_id IS NULL
  AND created_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM work_items 
    WHERE work_items.source_type = 'task' 
      AND work_items.source_id = tasks.id
      AND work_items.created_by = tasks.created_by
  );
```

---

## Technical Details

### Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/email-inbox-ingest/index.ts` | Add work_items insert after inbox_items insert |

### Database Operations

| Action | Purpose |
|--------|---------|
| Run email backfill SQL | Populate work_items for existing unresolved emails |
| Run task backfill SQL | Populate work_items for existing unlinked tasks |

### Why This Works

1. **Edge function handles new items**: Every new email automatically creates a work_item
2. **Backfill handles existing items**: SQL populates work_items for emails/tasks already in the system
3. **Non-blocking design**: Work item creation failures don't prevent email ingestion
4. **RLS compatible**: All operations use `created_by` matching the authenticated user

---

## Expected Result

After implementation:
- All new emails immediately appear in Focus Queue with "3 to review" count
- Existing unresolved emails are backfilled into the queue
- Unlinked tasks appear in the queue (if enabled)
- Users can triage, snooze, or mark items as trusted
