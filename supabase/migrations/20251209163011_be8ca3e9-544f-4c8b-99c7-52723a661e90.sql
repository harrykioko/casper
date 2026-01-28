-- Add is_flagged and is_archived columns to reading_items table
ALTER TABLE reading_items
ADD COLUMN is_flagged BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT false;

-- Create indexes for efficient filtering
CREATE INDEX idx_reading_items_is_flagged ON reading_items(is_flagged) WHERE is_flagged = true;
CREATE INDEX idx_reading_items_is_archived ON reading_items(is_archived) WHERE is_archived = true;