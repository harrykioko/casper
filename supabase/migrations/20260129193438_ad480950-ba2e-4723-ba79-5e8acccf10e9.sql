-- Add summary and forwarded_by tracking columns to inbox_items
ALTER TABLE inbox_items
ADD COLUMN IF NOT EXISTS forwarded_by_email TEXT,
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS summary_source TEXT DEFAULT 'heuristic',
ADD COLUMN IF NOT EXISTS summary_updated_at TIMESTAMPTZ;