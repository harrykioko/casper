-- Create trigger function to resolve inbox items when work_items exit triage
CREATE OR REPLACE FUNCTION public.trigger_resolve_inbox_on_work_item_exit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When a work_item transitions to trusted or ignored, resolve the source inbox item
  IF NEW.source_type = 'email'
     AND NEW.status IN ('trusted', 'ignored')
     AND (OLD.status IS NULL OR OLD.status NOT IN ('trusted', 'ignored'))
  THEN
    UPDATE public.inbox_items
    SET is_resolved = true,
        updated_at = now()
    WHERE id = NEW.source_id
      AND created_by = NEW.created_by
      AND is_resolved = false;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on work_items table
DROP TRIGGER IF EXISTS trg_resolve_inbox_on_work_item_exit ON public.work_items;
CREATE TRIGGER trg_resolve_inbox_on_work_item_exit
  AFTER UPDATE ON public.work_items
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_resolve_inbox_on_work_item_exit();