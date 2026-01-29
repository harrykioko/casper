-- Add new columns to inbox_suggestions for V2 structured suggestions
ALTER TABLE inbox_suggestions
ADD COLUMN IF NOT EXISTS intent text,
ADD COLUMN IF NOT EXISTS version integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS dismissed_ids jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS candidate_companies jsonb,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add index for cache validation lookups
CREATE INDEX IF NOT EXISTS idx_inbox_suggestions_cache 
ON inbox_suggestions (inbox_item_id, updated_at DESC);

-- Comment on new columns
COMMENT ON COLUMN inbox_suggestions.intent IS 'Classified email intent (intro_first_touch, pipeline_follow_up, etc.)';
COMMENT ON COLUMN inbox_suggestions.version IS 'Schema version for future migrations';
COMMENT ON COLUMN inbox_suggestions.dismissed_ids IS 'Array of suggestion IDs that user has dismissed';
COMMENT ON COLUMN inbox_suggestions.candidate_companies IS 'Cached candidate companies used for generation';
COMMENT ON COLUMN inbox_suggestions.updated_at IS 'Timestamp for cache validation';