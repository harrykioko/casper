-- ============================================================================
-- Phase 1 Migration: Effort Estimates & Snooze Infrastructure
-- ============================================================================
-- This migration adds:
-- 1. Effort estimates to tasks (effort_minutes, effort_category)
-- 2. Snooze tracking to tasks (snoozed_until, snooze_count, last_snoozed_at)
-- 3. Snooze log table for analytics and escalation tracking
-- 4. Enhanced snooze tracking for inbox_items
-- ============================================================================

-- ============================================================================
-- 1. EFFORT ESTIMATES ON TASKS
-- ============================================================================
-- Add effort estimation fields to tasks table
-- This enables filtering by "quick wins" and time-based prioritization

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS effort_minutes INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS effort_category TEXT
  CHECK (effort_category IN ('quick', 'medium', 'deep', 'unknown'))
  DEFAULT 'unknown';

-- Effort categories map to ranges:
-- quick: 1-15 minutes
-- medium: 15-60 minutes
-- deep: 60+ minutes
-- unknown: not estimated

COMMENT ON COLUMN tasks.effort_minutes IS 'Estimated time to complete task in minutes';
COMMENT ON COLUMN tasks.effort_category IS 'Effort bucket: quick (1-15min), medium (15-60min), deep (60+min), unknown';

-- ============================================================================
-- 2. SNOOZE INFRASTRUCTURE ON TASKS
-- ============================================================================
-- Add snooze tracking to tasks table
-- This enables reliable snooze with escalation detection

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS snoozed_until TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS snooze_count INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS last_snoozed_at TIMESTAMPTZ;

COMMENT ON COLUMN tasks.snoozed_until IS 'When the task should resurface (null = not snoozed)';
COMMENT ON COLUMN tasks.snooze_count IS 'Number of times this task has been snoozed (for escalation)';
COMMENT ON COLUMN tasks.last_snoozed_at IS 'When the task was last snoozed';

-- Index for efficient querying of snoozed tasks
CREATE INDEX IF NOT EXISTS idx_tasks_snoozed
  ON tasks(created_by, snoozed_until)
  WHERE snoozed_until IS NOT NULL;

-- ============================================================================
-- 3. ENHANCED SNOOZE TRACKING ON INBOX_ITEMS
-- ============================================================================
-- inbox_items already has snoozed_until, add count tracking

ALTER TABLE inbox_items ADD COLUMN IF NOT EXISTS snooze_count INTEGER DEFAULT 0;
ALTER TABLE inbox_items ADD COLUMN IF NOT EXISTS last_snoozed_at TIMESTAMPTZ;

COMMENT ON COLUMN inbox_items.snooze_count IS 'Number of times this item has been snoozed (for escalation)';
COMMENT ON COLUMN inbox_items.last_snoozed_at IS 'When the item was last snoozed';

-- ============================================================================
-- 4. SNOOZE LOG TABLE
-- ============================================================================
-- Universal snooze log for analytics and tracking user behavior
-- This helps identify items that are repeatedly snoozed (escalation candidates)

CREATE TABLE IF NOT EXISTS snooze_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What was snoozed
  entity_type TEXT NOT NULL CHECK (entity_type IN ('task', 'inbox', 'priority_item', 'commitment')),
  entity_id UUID NOT NULL,

  -- Snooze details
  snoozed_until TIMESTAMPTZ NOT NULL,
  snooze_reason TEXT,
  snooze_duration_hours INTEGER, -- Computed from snoozed_until - created_at

  -- Context
  priority_score_at_snooze DECIMAL(4,3), -- Score when snoozed (0.000 - 1.000)

  -- Ownership
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_snooze_log_entity
  ON snooze_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_snooze_log_user
  ON snooze_log(created_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_snooze_log_repeated
  ON snooze_log(entity_type, entity_id, created_by);

-- RLS policies for snooze_log
ALTER TABLE snooze_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own snooze logs"
  ON snooze_log FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own snooze logs"
  ON snooze_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

COMMENT ON TABLE snooze_log IS 'Audit log of all snooze actions for analytics and escalation tracking';

-- ============================================================================
-- 5. ESCALATION TRACKING VIEW
-- ============================================================================
-- View to identify items that have been snoozed multiple times

CREATE OR REPLACE VIEW escalation_candidates AS
SELECT
  entity_type,
  entity_id,
  created_by,
  COUNT(*) as snooze_count,
  MAX(created_at) as last_snoozed_at,
  AVG(snooze_duration_hours) as avg_snooze_hours
FROM snooze_log
GROUP BY entity_type, entity_id, created_by
HAVING COUNT(*) >= 3;

COMMENT ON VIEW escalation_candidates IS 'Items snoozed 3+ times - candidates for escalation or user nudge';

-- ============================================================================
-- 6. HELPER FUNCTION: Compute effort category from minutes
-- ============================================================================

CREATE OR REPLACE FUNCTION compute_effort_category(minutes INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF minutes IS NULL THEN
    RETURN 'unknown';
  ELSIF minutes <= 15 THEN
    RETURN 'quick';
  ELSIF minutes <= 60 THEN
    RETURN 'medium';
  ELSE
    RETURN 'deep';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION compute_effort_category IS 'Converts effort_minutes to effort_category bucket';

-- ============================================================================
-- 7. TRIGGER: Auto-update effort_category when effort_minutes changes
-- ============================================================================

CREATE OR REPLACE FUNCTION update_effort_category()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.effort_minutes IS DISTINCT FROM OLD.effort_minutes THEN
    NEW.effort_category := compute_effort_category(NEW.effort_minutes);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_effort_category ON tasks;
CREATE TRIGGER trigger_update_effort_category
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_effort_category();

-- ============================================================================
-- Done!
-- ============================================================================
