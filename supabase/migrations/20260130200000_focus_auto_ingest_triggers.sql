-- Focus Auto-Ingest Triggers & Schema Additions
-- Automatically creates work_items when source records are inserted,
-- and auto-exits work_items when source records are resolved/completed.

-- ============================================================
-- 1. Schema additions
-- ============================================================
ALTER TABLE public.work_items ADD COLUMN IF NOT EXISTS priority_score numeric DEFAULT 0;
ALTER TABLE public.work_items ADD COLUMN IF NOT EXISTS stale_since timestamptz;

CREATE INDEX IF NOT EXISTS idx_work_items_focus
  ON public.work_items (created_by, status, priority_score DESC);

-- ============================================================
-- 2. Auto-ingest trigger: inbox_items
-- ============================================================
CREATE OR REPLACE FUNCTION public.trigger_ingest_inbox_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.work_items (created_by, source_type, source_id, status, reason_codes, priority)
  VALUES (
    NEW.user_id,
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

DROP TRIGGER IF EXISTS trg_ingest_inbox_item ON public.inbox_items;
CREATE TRIGGER trg_ingest_inbox_item
  AFTER INSERT ON public.inbox_items
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_ingest_inbox_item();

-- ============================================================
-- 3. Auto-ingest trigger: tasks (only unlinked)
-- ============================================================
CREATE OR REPLACE FUNCTION public.trigger_ingest_task()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

DROP TRIGGER IF EXISTS trg_ingest_task ON public.tasks;
CREATE TRIGGER trg_ingest_task
  AFTER INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_ingest_task();

-- ============================================================
-- 4. Auto-ingest trigger: calendar_events
-- ============================================================
CREATE OR REPLACE FUNCTION public.trigger_ingest_calendar_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

DROP TRIGGER IF EXISTS trg_ingest_calendar_event ON public.calendar_events;
CREATE TRIGGER trg_ingest_calendar_event
  AFTER INSERT ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_ingest_calendar_event();

-- ============================================================
-- 5. Auto-ingest trigger: reading_items
-- ============================================================
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

DROP TRIGGER IF EXISTS trg_ingest_reading_item ON public.reading_items;
CREATE TRIGGER trg_ingest_reading_item
  AFTER INSERT ON public.reading_items
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_ingest_reading_item();

-- ============================================================
-- 6. Auto-exit trigger: inbox_items (resolved)
-- ============================================================
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
      AND created_by = NEW.user_id
      AND status NOT IN ('trusted', 'ignored');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_exit_inbox_item ON public.inbox_items;
CREATE TRIGGER trg_auto_exit_inbox_item
  AFTER UPDATE ON public.inbox_items
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_auto_exit_inbox_item();

-- ============================================================
-- 7. Auto-exit trigger: tasks (completed or archived)
-- ============================================================
CREATE OR REPLACE FUNCTION public.trigger_auto_exit_task()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

DROP TRIGGER IF EXISTS trg_auto_exit_task ON public.tasks;
CREATE TRIGGER trg_auto_exit_task
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_auto_exit_task();

-- ============================================================
-- 8. Staleness function (called client-side initially)
-- ============================================================
CREATE OR REPLACE FUNCTION public.mark_stale_work_items(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;
