-- Add is_top_priority column to tasks table
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS is_top_priority boolean NOT NULL DEFAULT false;

-- Add is_top_priority column to inbox_items table  
ALTER TABLE inbox_items
  ADD COLUMN IF NOT EXISTS is_top_priority boolean NOT NULL DEFAULT false;

-- Add partial indexes for fast lookup (only index true values)
CREATE INDEX IF NOT EXISTS idx_tasks_top_priority
  ON tasks (created_by, is_top_priority)
  WHERE is_top_priority = true;

CREATE INDEX IF NOT EXISTS idx_inbox_items_top_priority
  ON inbox_items (created_by, is_top_priority)
  WHERE is_top_priority = true;