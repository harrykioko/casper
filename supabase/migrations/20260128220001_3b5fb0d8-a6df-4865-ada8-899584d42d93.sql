-- Phase 2: Create inbox_attachments table
CREATE TABLE public.inbox_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inbox_item_id uuid NOT NULL REFERENCES public.inbox_items(id) ON DELETE CASCADE,
  filename text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

ALTER TABLE public.inbox_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attachments"
  ON public.inbox_attachments FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Service role can insert attachments"
  ON public.inbox_attachments FOR INSERT
  WITH CHECK (true);

-- Phase 2: Create inbox-attachments storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('inbox-attachments', 'inbox-attachments', false);

CREATE POLICY "Users can read their own inbox attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'inbox-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Phase 3B: Create inbox_suggestions cache table
CREATE TABLE public.inbox_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inbox_item_id uuid NOT NULL REFERENCES public.inbox_items(id) ON DELETE CASCADE,
  suggestions jsonb NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'ai',
  UNIQUE(inbox_item_id)
);

ALTER TABLE public.inbox_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view suggestions for their items"
  ON public.inbox_suggestions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.inbox_items 
    WHERE id = inbox_suggestions.inbox_item_id AND created_by = auth.uid()
  ));

CREATE POLICY "Users can insert suggestions for their items"
  ON public.inbox_suggestions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.inbox_items 
    WHERE id = inbox_suggestions.inbox_item_id AND created_by = auth.uid()
  ));

CREATE POLICY "Users can update suggestions for their items"
  ON public.inbox_suggestions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.inbox_items 
    WHERE id = inbox_suggestions.inbox_item_id AND created_by = auth.uid()
  ));

-- Phase 4: Add source_inbox_item_id to tasks for linking
ALTER TABLE public.tasks 
ADD COLUMN source_inbox_item_id uuid REFERENCES public.inbox_items(id) ON DELETE SET NULL;