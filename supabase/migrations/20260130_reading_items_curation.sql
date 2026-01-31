-- Reading List Curation: Add processing status, content classification, and enrichment columns

-- Processing lifecycle
ALTER TABLE reading_items
  ADD COLUMN IF NOT EXISTS processing_status text NOT NULL DEFAULT 'unprocessed'
    CHECK (processing_status IN ('unprocessed','queued','up_next','signal','read','archived')),
  ADD COLUMN IF NOT EXISTS processed_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- Classification
ALTER TABLE reading_items
  ADD COLUMN IF NOT EXISTS content_type text
    CHECK (content_type IN ('x_post','article','blog_post','newsletter','tool')),
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high')),
  ADD COLUMN IF NOT EXISTS read_later_bucket text
    CHECK (read_later_bucket IN ('today','this_week','someday'));

-- Enrichment (columns for Phase 2 AI, added now to avoid future migration)
ALTER TABLE reading_items
  ADD COLUMN IF NOT EXISTS one_liner text,
  ADD COLUMN IF NOT EXISTS topics text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS actionability text NOT NULL DEFAULT 'none'
    CHECK (actionability IN ('none','idea','follow_up','diligence')),
  ADD COLUMN IF NOT EXISTS saved_from text
    CHECK (saved_from IN ('x','email','web','manual','other')),
  ADD COLUMN IF NOT EXISTS entities jsonb DEFAULT '[]';

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_reading_items_status ON reading_items (created_by, processing_status);
CREATE INDEX IF NOT EXISTS idx_reading_items_bucket ON reading_items (created_by, read_later_bucket);
CREATE INDEX IF NOT EXISTS idx_reading_items_content_type ON reading_items (created_by, content_type);
CREATE INDEX IF NOT EXISTS idx_reading_items_topics ON reading_items USING GIN (topics);

-- Migrate existing items to new processing_status
-- Priority: archived > read > flagged > queued
UPDATE reading_items SET
  processing_status = CASE
    WHEN is_archived = true THEN 'archived'
    WHEN is_read = true THEN 'read'
    WHEN is_flagged = true THEN 'up_next'
    ELSE 'queued'
  END,
  processed_at = CASE
    WHEN is_archived = true OR is_read = true OR is_flagged = true THEN COALESCE(read_at, updated_at, now())
    ELSE now()  -- existing items treated as already curated
  END,
  archived_at = CASE
    WHEN is_archived = true THEN COALESCE(updated_at, now())
    ELSE null
  END
WHERE processing_status = 'unprocessed';  -- only migrate items still at default
