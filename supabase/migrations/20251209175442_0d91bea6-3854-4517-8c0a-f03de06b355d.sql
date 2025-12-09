-- Phase 1: Add metadata columns to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS type text DEFAULT 'other',
ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_activity_at timestamp with time zone DEFAULT now();

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_is_pinned ON public.projects(is_pinned);
CREATE INDEX IF NOT EXISTS idx_projects_last_activity_at ON public.projects(last_activity_at);

-- Phase 2: Create project_notes table
CREATE TABLE IF NOT EXISTS public.project_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text,
  content text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on project_notes
ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_notes (user can only access notes for their own projects)
CREATE POLICY "Users can view notes for their projects" 
ON public.project_notes 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE projects.id = project_notes.project_id 
  AND projects.created_by = auth.uid()
));

CREATE POLICY "Users can create notes for their projects" 
ON public.project_notes 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE projects.id = project_notes.project_id 
  AND projects.created_by = auth.uid()
));

CREATE POLICY "Users can update notes for their projects" 
ON public.project_notes 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE projects.id = project_notes.project_id 
  AND projects.created_by = auth.uid()
));

CREATE POLICY "Users can delete notes for their projects" 
ON public.project_notes 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE projects.id = project_notes.project_id 
  AND projects.created_by = auth.uid()
));

-- Create index for project_notes
CREATE INDEX IF NOT EXISTS idx_project_notes_project_id ON public.project_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_notes_created_at ON public.project_notes(created_at);

-- Trigger to update project's last_activity_at when notes change
CREATE OR REPLACE FUNCTION public.update_project_last_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.projects 
  SET last_activity_at = now() 
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_project_activity_on_note_change
AFTER INSERT OR UPDATE OR DELETE ON public.project_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_project_last_activity();

-- Updated_at trigger for project_notes
CREATE TRIGGER handle_project_notes_updated_at
BEFORE UPDATE ON public.project_notes
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();