ALTER TABLE tasks ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tasks_archived
  ON tasks (created_by, archived_at)
  WHERE archived_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_completed_aging
  ON tasks (created_by, completed_at)
  WHERE completed_at IS NOT NULL;

COMMENT ON COLUMN tasks.archived_at IS 'When task was archived; null = not archived';

-- Backfill: archive tasks completed more than 30 days ago
UPDATE tasks
SET archived_at = completed_at
WHERE completed = true
  AND completed_at < now() - interval '30 days'
  AND archived_at IS NULL;
