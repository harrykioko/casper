-- Add read_at timestamp column to track when items were first read
ALTER TABLE reading_items
ADD COLUMN read_at TIMESTAMPTZ;

-- Backfill: for items already marked as read, set read_at to updated_at
UPDATE reading_items 
SET read_at = updated_at 
WHERE is_read = true AND read_at IS NULL;