-- Obligations Engine V1 Migration
-- Adds bidirectional tracking, title, expected_by, resolved_at to commitments
-- Creates inbox_activity table for action logging
-- Adds 'commitment' as work_items source_type

-- 1. Add 'waiting_on' to the commitment_status enum FIRST (before any references)
-- ALTER TYPE ... ADD VALUE cannot run inside a transaction block in some PG versions,
-- but Supabase migrations handle this. Must come before any SQL that references the new value.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'waiting_on'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'commitment_status')
  ) THEN
    ALTER TYPE commitment_status ADD VALUE 'waiting_on';
  END IF;
END $$;

-- 2. Add new columns to commitments
ALTER TABLE commitments
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'owed_by_me' CHECK (direction IN ('owed_by_me', 'owed_to_me')),
  ADD COLUMN IF NOT EXISTS expected_by TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- 3. Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_commitments_direction_status
  ON commitments (created_by, direction, status);

-- Note: partial index with new enum value deferred to separate migration
-- since PG requires ADD VALUE to be committed first.
-- Use a non-partial index instead.
CREATE INDEX IF NOT EXISTS idx_commitments_expected_by
  ON commitments (expected_by)
  WHERE expected_by IS NOT NULL;

-- 4. Update work_items source_type constraint to include 'commitment'
-- First check if source_type is an enum or text with CHECK
DO $$
BEGIN
  -- Try dropping a CHECK constraint (may not exist if it's an enum)
  ALTER TABLE work_items DROP CONSTRAINT IF EXISTS work_items_source_type_check;
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

-- If source_type is text with CHECK, re-add the constraint
-- If it's an enum, this will be a no-op (the ADD CONSTRAINT will fail silently)
DO $$
BEGIN
  -- Only add CHECK if source_type is a text column (not an enum)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'work_items' AND column_name = 'source_type' AND data_type = 'text'
  ) THEN
    ALTER TABLE work_items
      ADD CONSTRAINT work_items_source_type_check
      CHECK (source_type IN ('email', 'calendar_event', 'task', 'note', 'reading', 'commitment'));
  END IF;
END $$;

-- If source_type is an enum type, add 'commitment' to it
DO $$
DECLARE
  v_type_name TEXT;
BEGIN
  SELECT udt_name INTO v_type_name
  FROM information_schema.columns
  WHERE table_name = 'work_items' AND column_name = 'source_type';

  -- If it's a custom enum type (not 'text'), add the new value
  IF v_type_name IS NOT NULL AND v_type_name != 'text' THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum
      WHERE enumlabel = 'commitment'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = v_type_name)
    ) THEN
      EXECUTE format('ALTER TYPE %I ADD VALUE %L', v_type_name, 'commitment');
    END IF;
  END IF;
END $$;

-- 5. Create inbox_activity table
CREATE TABLE IF NOT EXISTS inbox_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inbox_item_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  target_id UUID,
  target_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inbox_activity_user
  ON inbox_activity (created_by, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inbox_activity_inbox_item
  ON inbox_activity (inbox_item_id, created_at DESC);

-- RLS policies for inbox_activity
ALTER TABLE inbox_activity ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'inbox_activity' AND policyname = 'Users can read own inbox activity'
  ) THEN
    CREATE POLICY "Users can read own inbox activity"
      ON inbox_activity FOR SELECT
      USING (auth.uid() = created_by);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'inbox_activity' AND policyname = 'Users can insert own inbox activity'
  ) THEN
    CREATE POLICY "Users can insert own inbox activity"
      ON inbox_activity FOR INSERT
      WITH CHECK (auth.uid() = created_by);
  END IF;
END $$;

-- 6. Create mark_stale_commitments RPC function
CREATE OR REPLACE FUNCTION mark_stale_commitments(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
BEGIN
  -- Mark commitments as stale based on implied_urgency thresholds
  -- high/asap/today: 1 day
  -- medium/this_week/next_week: 3 days
  -- low/this_month/when_possible: 7 days
  -- default (no urgency): 3 days

  UPDATE commitments
  SET status = 'broken'
  WHERE created_by = p_user_id
    AND status::text IN ('open', 'waiting_on')
    AND resolved_at IS NULL
    AND due_at IS NOT NULL
    AND (
      (implied_urgency IN ('asap', 'today') AND due_at + INTERVAL '1 day' < v_now)
      OR (implied_urgency IN ('this_week', 'next_week') AND due_at + INTERVAL '3 days' < v_now)
      OR (implied_urgency IN ('this_month', 'when_possible') AND due_at + INTERVAL '7 days' < v_now)
      OR (implied_urgency IS NULL AND due_at + INTERVAL '3 days' < v_now)
    );
END;
$$;
