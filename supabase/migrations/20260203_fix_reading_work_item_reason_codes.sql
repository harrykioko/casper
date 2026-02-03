-- Fix: Reading work items were created by DB trigger with empty reason_codes,
-- causing them to be auto-resolved as 'trusted' by the focus queue reconciliation.

-- 1. Update the trigger function to set proper reason codes
CREATE OR REPLACE FUNCTION public.trigger_ingest_reading_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reason_codes text[];
BEGIN
  -- Only create work items for unprocessed reading items (need triage)
  IF NEW.processing_status = 'unprocessed' THEN
    v_reason_codes := ARRAY['unprocessed']::text[];
    IF NEW.one_liner IS NULL OR NEW.one_liner = '' THEN
      v_reason_codes := v_reason_codes || ARRAY['missing_summary']::text[];
    END IF;

    INSERT INTO public.work_items (created_by, source_type, source_id, status, reason_codes, priority)
    VALUES (
      NEW.created_by,
      'reading',
      NEW.id,
      'needs_review',
      v_reason_codes,
      2
    )
    ON CONFLICT (source_type, source_id, created_by) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Fix existing reading work items that were auto-resolved with empty reason_codes
-- Re-open them as needs_review if the reading item is still unprocessed
UPDATE public.work_items wi
SET
  status = 'needs_review',
  reason_codes = ARRAY['unprocessed', 'missing_summary']::text[],
  priority = 2,
  trusted_at = NULL
FROM public.reading_items ri
WHERE wi.source_type = 'reading'
  AND wi.source_id = ri.id
  AND wi.status = 'trusted'
  AND wi.reason_codes = ARRAY[]::text[]
  AND ri.processing_status = 'unprocessed';

-- 3. Also fix any needs_review reading work items with empty reason_codes
UPDATE public.work_items wi
SET
  reason_codes = ARRAY['unprocessed']::text[],
  priority = 2
FROM public.reading_items ri
WHERE wi.source_type = 'reading'
  AND wi.source_id = ri.id
  AND wi.status = 'needs_review'
  AND wi.reason_codes = ARRAY[]::text[]
  AND ri.processing_status = 'unprocessed';
