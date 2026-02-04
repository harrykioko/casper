-- Smarter task triage entry criteria + auto-exit on enrichment

-- Update trigger_ingest_task to only create work_items for truly unenriched tasks
CREATE OR REPLACE FUNCTION public.trigger_ingest_task()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create work_item for tasks that are:
  -- 1. Not linked to a project or company
  -- 2. Not already enriched with deadline or priority
  IF NEW.project_id IS NULL 
     AND NEW.company_id IS NULL 
     AND NEW.pipeline_company_id IS NULL
     AND NEW.scheduled_for IS NULL
     AND NEW.priority IS NULL
  THEN
    INSERT INTO public.work_items (created_by, source_type, source_id, status, reason_codes, priority)
    VALUES (
      NEW.created_by,
      'task',
      NEW.id,
      'needs_review',
      ARRAY['unlinked_company'],
      2
    )
    ON CONFLICT (source_type, source_id, created_by) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger function for auto-exit when task becomes enriched
CREATE OR REPLACE FUNCTION public.trigger_auto_exit_enriched_task()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If task now has a link or enrichment (when it didn't before), exit from triage
  IF (NEW.project_id IS NOT NULL AND (OLD.project_id IS NULL OR OLD.project_id IS DISTINCT FROM NEW.project_id))
     OR (NEW.company_id IS NOT NULL AND (OLD.company_id IS NULL OR OLD.company_id IS DISTINCT FROM NEW.company_id))
     OR (NEW.pipeline_company_id IS NOT NULL AND (OLD.pipeline_company_id IS NULL OR OLD.pipeline_company_id IS DISTINCT FROM NEW.pipeline_company_id))
     OR (NEW.scheduled_for IS NOT NULL AND (OLD.scheduled_for IS NULL OR OLD.scheduled_for IS DISTINCT FROM NEW.scheduled_for))
     OR (NEW.priority IS NOT NULL AND (OLD.priority IS NULL OR OLD.priority IS DISTINCT FROM NEW.priority))
  THEN
    UPDATE public.work_items
    SET status = 'trusted',
        trusted_at = now(),
        reviewed_at = now(),
        last_touched_at = now(),
        updated_at = now(),
        reason_codes = ARRAY[]::text[]
    WHERE source_type = 'task'
      AND source_id = NEW.id
      AND created_by = NEW.created_by
      AND status NOT IN ('trusted', 'ignored');
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS trg_auto_exit_enriched_task ON public.tasks;
CREATE TRIGGER trg_auto_exit_enriched_task
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_auto_exit_enriched_task();