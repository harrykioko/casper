-- Create note_target_type enum for polymorphic linking
CREATE TYPE public.note_target_type AS ENUM ('task', 'company', 'project', 'reading_item');

-- Add note_type column to project_notes for categorization
ALTER TABLE public.project_notes ADD COLUMN IF NOT EXISTS note_type text;

-- Make project_id nullable to support notes not linked to projects
ALTER TABLE public.project_notes ALTER COLUMN project_id DROP NOT NULL;

-- Create note_links polymorphic junction table
CREATE TABLE public.note_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES public.project_notes(id) ON DELETE CASCADE,
  target_type note_target_type NOT NULL,
  target_id uuid NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(note_id, target_type, target_id)
);

-- Enable RLS on note_links
ALTER TABLE public.note_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for note_links - users can only see/manipulate links for their own notes
CREATE POLICY "Users can view links for their notes" ON public.note_links
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.project_notes 
    WHERE project_notes.id = note_links.note_id 
    AND project_notes.created_by = auth.uid()
  ));

CREATE POLICY "Users can create links for their notes" ON public.note_links
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.project_notes 
    WHERE project_notes.id = note_links.note_id 
    AND project_notes.created_by = auth.uid()
  ));

CREATE POLICY "Users can delete links for their notes" ON public.note_links
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.project_notes 
    WHERE project_notes.id = note_links.note_id 
    AND project_notes.created_by = auth.uid()
  ));

-- Indexes for performance
CREATE INDEX idx_note_links_note_id ON public.note_links(note_id);
CREATE INDEX idx_note_links_target ON public.note_links(target_type, target_id);

-- Backfill existing project notes with note_links entries
INSERT INTO public.note_links (note_id, target_type, target_id, is_primary)
SELECT id, 'project'::note_target_type, project_id, true
FROM public.project_notes
WHERE project_id IS NOT NULL
ON CONFLICT DO NOTHING;