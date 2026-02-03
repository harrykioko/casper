-- Fix trigger_auto_exit_inbox_item: change user_id to created_by
CREATE OR REPLACE FUNCTION public.trigger_auto_exit_inbox_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.is_resolved = true AND (OLD.is_resolved IS NULL OR OLD.is_resolved = false) THEN
    UPDATE public.work_items
    SET status = 'trusted',
        trusted_at = now(),
        reviewed_at = now(),
        last_touched_at = now(),
        updated_at = now()
    WHERE source_type = 'email'
      AND source_id = NEW.id
      AND created_by = NEW.created_by
      AND status NOT IN ('trusted', 'ignored');
  END IF;
  RETURN NEW;
END;
$$;

-- Fix trigger_ingest_inbox_item: change user_id to created_by
CREATE OR REPLACE FUNCTION public.trigger_ingest_inbox_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.work_items (created_by, source_type, source_id, status, reason_codes, priority)
  VALUES (
    NEW.created_by,
    'email',
    NEW.id,
    'needs_review',
    ARRAY['missing_summary'],
    5
  )
  ON CONFLICT (source_type, source_id, created_by) DO NOTHING;
  RETURN NEW;
END;
$$;