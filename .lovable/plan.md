

# Sync Triage Clearing with Inbox Resolution

## Problem

When inbox items are cleared from the Triage queue (marked as "trusted" or "ignored" in the `work_items` table), they remain visible in the main Inbox view. The user expects these emails to be removed from the active Inbox since they've been triaged, while still remaining accessible via:
- Search
- Linked tasks
- Linked entities (companies, obligations)
- Direct deep links

## Current State

### Inbox filtering (useInboxItems.ts, line 161)
```typescript
let query = supabase
  .from("inbox_items")
  .select("*")
  .eq("is_resolved", false);  // Only shows unresolved items
```

### Triage clearing (useWorkItemActions.ts)
- `markTrusted()`: Updates work_item status to 'trusted' but does NOT touch inbox_items
- `noAction()`: Updates work_item status to 'ignored' but does NOT touch inbox_items

### Existing triggers (one-way only)
- When `inbox_items.is_resolved` becomes true → work_item marked as 'trusted' ✅
- When work_item becomes 'trusted'/'ignored' → inbox_items.is_resolved NOT updated ❌

This is the gap: there's no reverse trigger to sync from work_items back to inbox_items.

## Solution

Add a database trigger that automatically sets `inbox_items.is_resolved = true` when the corresponding `work_items` record transitions to 'trusted' or 'ignored' status. This ensures bi-directional sync between the triage system and inbox visibility.

## Implementation

### Database Migration: New Trigger

Create a new trigger function `trigger_resolve_inbox_on_work_item_exit()` that fires when a work_item is updated to 'trusted' or 'ignored':

```sql
CREATE OR REPLACE FUNCTION public.trigger_resolve_inbox_on_work_item_exit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When a work_item transitions to trusted or ignored, resolve the source inbox item
  IF NEW.source_type = 'email'
     AND NEW.status IN ('trusted', 'ignored')
     AND (OLD.status IS NULL OR OLD.status NOT IN ('trusted', 'ignored'))
  THEN
    UPDATE public.inbox_items
    SET is_resolved = true,
        updated_at = now()
    WHERE id = NEW.source_id
      AND created_by = NEW.created_by
      AND is_resolved = false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_resolve_inbox_on_work_item_exit ON public.work_items;
CREATE TRIGGER trg_resolve_inbox_on_work_item_exit
  AFTER UPDATE ON public.work_items
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_resolve_inbox_on_work_item_exit();
```

### Why a database trigger (vs. application code)?

1. **Atomicity**: The resolution happens in the same transaction as the work_item update
2. **Consistency**: Works regardless of which action triggers the exit (manual trusted, no action, auto-exit from linking, etc.)
3. **Simplicity**: No need to modify multiple frontend handlers
4. **Existing pattern**: Matches the existing auto-exit triggers already in the codebase

## Behavior After Implementation

| Action | Effect on work_items | Effect on inbox_items |
|--------|---------------------|----------------------|
| "Mark Trusted" in Triage | status → 'trusted' | is_resolved → true (via trigger) |
| "No Action" in Triage | status → 'ignored' | is_resolved → true (via trigger) |
| "No Action" quick action (email row) | status → 'ignored' | is_resolved → true (via trigger) |
| Auto-exit from linking entity | status → 'trusted' | is_resolved → true (via trigger) |
| Manual "Mark Complete" in Inbox | is_resolved → true | (triggers work_item exit) |

## Accessibility After Resolution

Resolved inbox items will still be:
- **Searchable**: Update Inbox search to optionally include resolved items (future enhancement if needed)
- **Viewable from linked tasks**: Tasks with `source_inbox_item_id` can fetch the email via `fetchInboxItemById()`
- **Viewable from company pages**: Company communications query can include resolved items
- **Viewable in Archive**: Already works via `useInboxItems({ onlyArchived: true })` plus a query filter adjustment

## Files Changed

| File | Change |
|------|--------|
| New migration SQL | Add `trigger_resolve_inbox_on_work_item_exit` function and trigger |

## Edge Cases

1. **Already resolved**: Trigger only acts if `is_resolved = false`, preventing redundant updates
2. **Non-email work items**: Trigger only fires for `source_type = 'email'`
3. **Snoozing**: Snooze sets `status = 'snoozed'`, not 'trusted'/'ignored', so items remain in inbox while snoozed

