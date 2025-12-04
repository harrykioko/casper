-- Phase 1: Add columns to pipeline_companies
ALTER TABLE public.pipeline_companies 
ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Phase 2: Add pipeline_company_id to tasks table
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS pipeline_company_id UUID REFERENCES public.pipeline_companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_pipeline_company_id ON public.tasks(pipeline_company_id);

-- Phase 3: Create pipeline_contacts table
CREATE TABLE IF NOT EXISTS public.pipeline_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_company_id UUID NOT NULL REFERENCES public.pipeline_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT,
  is_founder BOOLEAN NOT NULL DEFAULT true,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pipeline_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contacts for their pipeline companies"
ON public.pipeline_contacts FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.pipeline_companies
  WHERE pipeline_companies.id = pipeline_contacts.pipeline_company_id
  AND pipeline_companies.created_by = auth.uid()
));

CREATE POLICY "Users can create contacts for their pipeline companies"
ON public.pipeline_contacts FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.pipeline_companies
  WHERE pipeline_companies.id = pipeline_contacts.pipeline_company_id
  AND pipeline_companies.created_by = auth.uid()
));

CREATE POLICY "Users can update contacts for their pipeline companies"
ON public.pipeline_contacts FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.pipeline_companies
  WHERE pipeline_companies.id = pipeline_contacts.pipeline_company_id
  AND pipeline_companies.created_by = auth.uid()
));

CREATE POLICY "Users can delete contacts for their pipeline companies"
ON public.pipeline_contacts FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.pipeline_companies
  WHERE pipeline_companies.id = pipeline_contacts.pipeline_company_id
  AND pipeline_companies.created_by = auth.uid()
));

-- Phase 4: Create pipeline_interactions table
CREATE TABLE IF NOT EXISTS public.pipeline_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_company_id UUID NOT NULL REFERENCES public.pipeline_companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.pipeline_contacts(id) ON DELETE SET NULL,
  interaction_type public.interaction_type NOT NULL DEFAULT 'note',
  content TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pipeline_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view interactions for their pipeline companies"
ON public.pipeline_interactions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.pipeline_companies
  WHERE pipeline_companies.id = pipeline_interactions.pipeline_company_id
  AND pipeline_companies.created_by = auth.uid()
));

CREATE POLICY "Users can create interactions for their pipeline companies"
ON public.pipeline_interactions FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.pipeline_companies
  WHERE pipeline_companies.id = pipeline_interactions.pipeline_company_id
  AND pipeline_companies.created_by = auth.uid()
));

CREATE POLICY "Users can update interactions for their pipeline companies"
ON public.pipeline_interactions FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.pipeline_companies
  WHERE pipeline_companies.id = pipeline_interactions.pipeline_company_id
  AND pipeline_companies.created_by = auth.uid()
));

CREATE POLICY "Users can delete interactions for their pipeline companies"
ON public.pipeline_interactions FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.pipeline_companies
  WHERE pipeline_companies.id = pipeline_interactions.pipeline_company_id
  AND pipeline_companies.created_by = auth.uid()
));

-- Phase 5: Create trigger to auto-update last_interaction_at
CREATE OR REPLACE FUNCTION public.update_pipeline_company_last_interaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.pipeline_companies 
  SET last_interaction_at = NEW.occurred_at 
  WHERE id = NEW.pipeline_company_id 
    AND (last_interaction_at IS NULL OR last_interaction_at < NEW.occurred_at);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_pipeline_interaction_created ON public.pipeline_interactions;

CREATE TRIGGER on_pipeline_interaction_created
AFTER INSERT ON public.pipeline_interactions
FOR EACH ROW
EXECUTE FUNCTION public.update_pipeline_company_last_interaction();

-- Phase 6: Migrate existing pipeline_notes to pipeline_interactions
INSERT INTO public.pipeline_interactions (pipeline_company_id, interaction_type, content, occurred_at, created_by, created_at)
SELECT 
  pipeline_id,
  'note'::public.interaction_type,
  COALESCE(body, ''),
  COALESCE(created_at, now()),
  created_by,
  COALESCE(created_at, now())
FROM public.pipeline_notes
WHERE body IS NOT NULL AND body != '';

-- Update last_interaction_at for pipeline companies based on migrated notes
UPDATE public.pipeline_companies pc
SET last_interaction_at = (
  SELECT MAX(occurred_at)
  FROM public.pipeline_interactions pi
  WHERE pi.pipeline_company_id = pc.id
)
WHERE EXISTS (
  SELECT 1 FROM public.pipeline_interactions pi
  WHERE pi.pipeline_company_id = pc.id
);