-- Fix function_search_path_mutable warnings by setting search_path = public

-- 1. update_people_updated_at
CREATE OR REPLACE FUNCTION public.update_people_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 2. update_commitments_updated_at
CREATE OR REPLACE FUNCTION public.update_commitments_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 3. set_commitment_completed_at
CREATE OR REPLACE FUNCTION public.set_commitment_completed_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = now();
  END IF;
  IF NEW.status = 'delegated' AND OLD.status != 'delegated' THEN
    NEW.delegated_at = now();
  END IF;
  RETURN NEW;
END;
$function$;

-- 4. trigger_ingest_task
CREATE OR REPLACE FUNCTION public.trigger_ingest_task()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Only create work_item for tasks not linked to a project or company
  IF NEW.project_id IS NULL AND NEW.company_id IS NULL AND NEW.pipeline_company_id IS NULL THEN
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
$function$;

-- 5. trigger_ingest_calendar_event
CREATE OR REPLACE FUNCTION public.trigger_ingest_calendar_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.work_items (created_by, source_type, source_id, status, reason_codes, priority)
  VALUES (
    NEW.user_id,
    'calendar_event',
    NEW.id,
    'needs_review',
    ARRAY['unlinked_company'],
    3
  )
  ON CONFLICT (source_type, source_id, created_by) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- 6. trigger_ingest_reading_item
CREATE OR REPLACE FUNCTION public.trigger_ingest_reading_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- 7. trigger_auto_exit_task
CREATE OR REPLACE FUNCTION public.trigger_auto_exit_task()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF (NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false))
     OR (NEW.archived_at IS NOT NULL AND OLD.archived_at IS NULL)
     OR (NEW.status = 'done' AND OLD.status IS DISTINCT FROM 'done') THEN
    UPDATE public.work_items
    SET status = 'trusted',
        trusted_at = now(),
        reviewed_at = now(),
        last_touched_at = now(),
        updated_at = now()
    WHERE source_type = 'task'
      AND source_id = NEW.id
      AND created_by = NEW.created_by
      AND status NOT IN ('trusted', 'ignored');
  END IF;
  RETURN NEW;
END;
$function$;

-- 8. mark_stale_work_items
CREATE OR REPLACE FUNCTION public.mark_stale_work_items(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.work_items
  SET reason_codes = array_append(reason_codes, 'stale'),
      stale_since = COALESCE(stale_since, now()),
      updated_at = now()
  WHERE created_by = p_user_id
    AND status IN ('needs_review', 'enriched_pending')
    AND last_touched_at < now() - interval '7 days'
    AND NOT ('stale' = ANY(reason_codes));

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$function$;

-- 9. trigger_auto_exit_inbox_item
CREATE OR REPLACE FUNCTION public.trigger_auto_exit_inbox_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- 10. trigger_ingest_inbox_item
CREATE OR REPLACE FUNCTION public.trigger_ingest_inbox_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- 11. mark_stale_commitments
CREATE OR REPLACE FUNCTION public.mark_stale_commitments(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_now TIMESTAMPTZ := now();
BEGIN
  UPDATE commitments
  SET status = 'broken'
  WHERE created_by = p_user_id
    AND status::text IN ('open', 'waiting_on')
    AND resolved_at IS NULL
    AND due_at IS NOT NULL
    AND (
      (implied_urgency IN ('asap', 'today') AND due_at + INTERVAL '1 day' < v_now)
      OR (implied_urgency IN ('this_week', 'next_week') AND due_at + INTERVAL '3 days' < v_now)
      OR (implied_urgency IN ('this_month', 'when_possible') AND due_at + INTERVAL '7 days' < v_now)
      OR (implied_urgency IS NULL AND due_at + INTERVAL '3 days' < v_now)
    );
END;
$function$;