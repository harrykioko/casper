-- Add thread context columns for better email summarization
ALTER TABLE public.inbox_items
ADD COLUMN IF NOT EXISTS thread_clean_text text,
ADD COLUMN IF NOT EXISTS thread_message_count integer,
ADD COLUMN IF NOT EXISTS extraction_basis text;

COMMENT ON COLUMN public.inbox_items.thread_clean_text IS 'Concatenated thread messages for context-aware extraction';
COMMENT ON COLUMN public.inbox_items.thread_message_count IS 'Number of messages in thread_clean_text';
COMMENT ON COLUMN public.inbox_items.extraction_basis IS 'latest or thread - indicates which text was used for extraction';