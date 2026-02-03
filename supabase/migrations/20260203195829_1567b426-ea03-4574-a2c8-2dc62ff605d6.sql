-- Fix Security Definer View errors by using SECURITY INVOKER

-- 1. Drop existing views
DROP VIEW IF EXISTS public.people_with_roles CASCADE;
DROP VIEW IF EXISTS public.open_commitments_detailed CASCADE;
DROP VIEW IF EXISTS public.overdue_commitments CASCADE;

-- 2. Recreate people_with_roles with security_invoker = true
CREATE VIEW public.people_with_roles
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.name,
  p.email,
  p.phone,
  p.linkedin_url,
  p.avatar_url,
  p.relationship_tier,
  p.is_vip,
  p.notes,
  p.tags,
  p.created_by,
  p.created_at,
  p.updated_at,
  COALESCE(
    json_agg(
      json_build_object(
        'role_id', pcr.id,
        'company_id', pcr.company_id,
        'company_type', pcr.company_type,
        'role', pcr.role,
        'is_founder', pcr.is_founder,
        'is_primary_contact', pcr.is_primary_contact,
        'is_current', pcr.is_current
      )
    ) FILTER (WHERE pcr.id IS NOT NULL),
    '[]'
  ) as company_roles
FROM public.people p
LEFT JOIN public.person_company_roles pcr 
  ON p.id = pcr.person_id AND pcr.is_current = true
GROUP BY p.id;

COMMENT ON VIEW public.people_with_roles IS 
  'People with their current company affiliations (uses security invoker)';

-- 3. Recreate open_commitments_detailed with security_invoker = true
CREATE VIEW public.open_commitments_detailed
WITH (security_invoker = true)
AS
SELECT
  c.id,
  c.content,
  c.context,
  c.person_id,
  c.person_name,
  c.company_id,
  c.company_type,
  c.company_name,
  c.promised_at,
  c.due_at,
  c.implied_urgency,
  c.source_type,
  c.source_id,
  c.source_reference,
  c.status,
  c.completed_at,
  c.completed_via,
  c.completion_notes,
  c.delegated_to_person_id,
  c.delegated_to_name,
  c.delegated_at,
  c.snoozed_until,
  c.snooze_count,
  c.last_snoozed_at,
  c.created_by,
  c.created_at,
  c.updated_at,
  p.email as person_email,
  p.avatar_url as person_avatar
FROM public.commitments c
LEFT JOIN public.people p ON c.person_id = p.id
WHERE c.status = 'open';

COMMENT ON VIEW public.open_commitments_detailed IS 
  'Open commitments with related person details (uses security invoker)';

-- 4. Recreate overdue_commitments with security_invoker = true
CREATE VIEW public.overdue_commitments
WITH (security_invoker = true)
AS
SELECT
  c.id,
  c.content,
  c.context,
  c.person_id,
  c.person_name,
  c.company_id,
  c.company_type,
  c.company_name,
  c.promised_at,
  c.due_at,
  c.implied_urgency,
  c.source_type,
  c.source_id,
  c.source_reference,
  c.status,
  c.completed_at,
  c.completed_via,
  c.completion_notes,
  c.delegated_to_person_id,
  c.delegated_to_name,
  c.delegated_at,
  c.snoozed_until,
  c.snooze_count,
  c.last_snoozed_at,
  c.created_by,
  c.created_at,
  c.updated_at
FROM public.commitments c
WHERE c.status = 'open'
  AND c.due_at IS NOT NULL
  AND c.due_at < now();

COMMENT ON VIEW public.overdue_commitments IS 
  'Commitments past their due date (uses security invoker)';