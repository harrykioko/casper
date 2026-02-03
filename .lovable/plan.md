

# Fix Inbox Mark Complete Error

## Problem Identified

When marking an inbox item as complete, the database returns the error:
```
record "new" has no field "user_id"
```

This is caused by two database triggers that reference the wrong column name:

1. **`trigger_auto_exit_inbox_item`** (line 161): References `NEW.user_id` but the `inbox_items` table uses `created_by`
2. **`trigger_ingest_inbox_item`** (line 25): Same issue - references `NEW.user_id` instead of `NEW.created_by`

Both triggers were created with incorrect column references that do not match the actual `inbox_items` table schema.

---

## Solution

Update both trigger functions to use the correct column name `created_by` instead of `user_id`.

---

## Database Migration

A single migration will fix both trigger functions:

```sql
-- Fix trigger_auto_exit_inbox_item: change user_id to created_by
CREATE OR REPLACE FUNCTION public.trigger_auto_exit_inbox_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.is_resolved = true AND (OLD.is_resolved IS NULL OR OLD.is_resolved = false) THEN
    UPDATE public.work_items
    SET status = 'trusted',
        trusted_at = now(),
        reviewed_at = now(),
        last_touched_at = now(),
        updated_at = now()
    WHERE source_type = 'email'
      AND source_id = NEW.id
      AND created_by = NEW.created_by  -- Fixed: was NEW.user_id
      AND status NOT IN ('trusted', 'ignored');
  END IF;
  RETURN NEW;
END;
$$;

-- Fix trigger_ingest_inbox_item: change user_id to created_by
CREATE OR REPLACE FUNCTION public.trigger_ingest_inbox_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.work_items (created_by, source_type, source_id, status, reason_codes, priority)
  VALUES (
    NEW.created_by,  -- Fixed: was NEW.user_id
    'email',
    NEW.id,
    'needs_review',
    ARRAY['missing_summary'],
    5
  )
  ON CONFLICT (source_type, source_id, created_by) DO NOTHING;
  RETURN NEW;
END;
$$;
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/migrations/[timestamp]_fix_inbox_trigger_column_name.sql` | Fix both trigger functions to use correct column |

---

## What This Fixes

After applying this migration:
- Marking inbox items as complete will work correctly
- The work_items table will be updated when inbox items are resolved
- New inbox items will properly create work_items entries

---

## Technical Notes

1. The `inbox_items` table uses `created_by` for the user ID column
2. The `calendar_events` table uses `user_id` (which is why that trigger works correctly)
3. This is a pure database fix - no frontend code changes needed

