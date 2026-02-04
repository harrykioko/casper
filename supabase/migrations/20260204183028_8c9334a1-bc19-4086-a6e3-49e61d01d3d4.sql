-- Add extraction columns to inbox_items for structured email summaries
ALTER TABLE public.inbox_items
ADD COLUMN IF NOT EXISTS extracted_summary text,
ADD COLUMN IF NOT EXISTS extracted_key_points jsonb,
ADD COLUMN IF NOT EXISTS extracted_next_step jsonb,
ADD COLUMN IF NOT EXISTS extracted_entities jsonb,
ADD COLUMN IF NOT EXISTS extracted_people jsonb,
ADD COLUMN IF NOT EXISTS extracted_categories text[],
ADD COLUMN IF NOT EXISTS extraction_version text DEFAULT 'v1',
ADD COLUMN IF NOT EXISTS extracted_at timestamptz;

-- Add comment for documentation
COMMENT ON COLUMN public.inbox_items.extracted_summary IS '1-2 sentence AI-generated overview';
COMMENT ON COLUMN public.inbox_items.extracted_key_points IS 'Array of 3-7 bullet point strings';
COMMENT ON COLUMN public.inbox_items.extracted_next_step IS 'Object with label and is_action_required boolean';
COMMENT ON COLUMN public.inbox_items.extracted_entities IS 'Array of {name, type, confidence} objects';
COMMENT ON COLUMN public.inbox_items.extracted_people IS 'Array of {name, email, confidence} objects';
COMMENT ON COLUMN public.inbox_items.extracted_categories IS 'Categories: update, request, intro, scheduling, follow_up, finance, other';
COMMENT ON COLUMN public.inbox_items.extraction_version IS 'Prompt version for future updates';
COMMENT ON COLUMN public.inbox_items.extracted_at IS 'When extraction was completed';